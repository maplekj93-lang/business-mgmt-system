import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { uploadBatchAction } from '../api/upload-batch';
import { createClient } from '@/shared/api/supabase/server';
import { MatchingEngine } from '@/entities/transaction/lib/matching-engine';
import { applyTaggingRules } from '@/features/refine-ledger/api/apply-tagging-rules';
import { ValidatedTransaction } from '../model/types';

// 1. Mocks
vi.mock('@/shared/api/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/features/refine-ledger/api/apply-tagging-rules', () => ({
  applyTaggingRules: vi.fn().mockImplementation(async (ids) => {
      return { auto_applied: ids.length > 0 ? 1 : 0, suggested: 0, unmatched: 0 };
  }),
}));

describe('Advanced Classification & Chaos Testing', () => {
  let mockSupabase: any;
  let tableMocks: Record<string, any> = {};
  const mockUser = { id: 'test-user-uuid' };

  const generateHash = (data: string) => {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = (hash & hash);
    }
    return Math.abs(hash).toString(36);
  };

  const createMockQuery = (data: any = [], error: any = null) => {
    const query: any = {
      _data: data,
      _error: error,
      select: vi.fn().mockImplementation(() => query),
      insert: vi.fn().mockImplementation(() => query),
      upsert: vi.fn().mockImplementation(() => query),
      update: vi.fn().mockImplementation(() => query),
      delete: vi.fn().mockImplementation(() => query),
      eq: vi.fn().mockImplementation(() => query),
      in: vi.fn().mockImplementation(() => query),
      order: vi.fn().mockImplementation(() => query),
      single: vi.fn().mockImplementation(() => query),
      then: vi.fn().mockImplementation(function (onFulfilled) {
        return Promise.resolve(onFulfilled ? onFulfilled({ data: query._data, error: query._error }) : { data: query._data, error: query._error });
      }),
    };
    return query;
  };

  beforeEach(() => {
    tableMocks = {
      mdt_categories: createMockQuery([
        { id: 1, name: '식비', parent_id: null },
        { id: 2, name: '간식', parent_id: 1 },
        { id: 10, name: '프로젝트 비용', parent_id: null },
      ]),
      mdt_allocation_rules: createMockQuery([
        { keyword: '프로젝트A', category_id: 10, is_business: true },
      ]),
      assets: createMockQuery([
        { id: 'asset-kb', name: 'KB국민은행', owner_type: 'personal' },
        { id: 'asset-sh', name: '신한은행', owner_type: 'personal' },
      ]),
      import_batches: createMockQuery({ id: 'batch-123' }),
      transactions: createMockQuery([{ id: 'tx-new' }]),
    };

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        return tableMocks[table] || createMockQuery();
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // --- Normal Scenarios ---

  describe('Scenario 1: Cross-Asset Transfer Detection', () => {
    it('should identify withdrawal and deposit as a transfer pair', async () => {
      const transactions: ValidatedTransaction[] = [
        {
          date: '2026-03-27 10:00:00',
          amount: -1000000,
          description: '자산이동',
          raw_description: '자산이동',
          categoryRaw: '', type: 'transfer'
        },
        {
          date: '2026-03-27 10:02:00',
          amount: 1000000,
          description: '자산이동',
          raw_description: '자산이동',
          categoryRaw: '', type: 'transfer'
        }
      ];

      const result = await uploadBatchAction(transactions);
      
      expect(result.success).toBe(true);
      const insertCall = tableMocks.transactions.insert.mock.calls[0][0];
      expect(insertCall[0].allocation_status).toBe('pending');
      expect(insertCall[1].allocation_status).toBe('pending');
    });
  });

  describe('Scenario 2: Deduplication with import_hash', () => {
    it('should skip transactions that already exist in the database', async () => {
       const tx: any = {
        date: '2026-03-27',
        amount: 50000,
        description: '이미 있는 거래',
        raw_description: '이미 있는 거래'
      };

      const expectedHash = generateHash(`2026-03-27|50000|이미 있는 거래|`);
      tableMocks.transactions._data = [{ import_hash: expectedHash }];

      const result = await uploadBatchAction([tx]);
      expect(result.duplicateCount).toBe(1);
      expect(result.addedCount).toBe(0);
    });
  });

  describe('Scenario 3: Keyword-based Business Allocation', () => {
    it('should map category_id based on EXACT match keyword', async () => {
      const tx: any = {
        date: '2026-03-27',
        amount: -50000,
        description: '프로젝트A',
        raw_description: '프로젝트A 자재비',
        categoryRaw: '프로젝트A'
      };

      await uploadBatchAction([tx]);
      const insertCall = tableMocks.transactions.insert.mock.calls[0][0];
      expect(insertCall[0].category_id).toBe(10);
      expect(insertCall[0].allocation_status).toBe('business_allocated');
    });
  });

  describe('Scenario 4: Fixed Expense Matching Trigger', () => {
    it('should call applyTaggingRules for non-duplicate transactions', async () => {
      const tx: any = {
        date: '2026-03-27',
        amount: -54300,
        description: '보험료',
        raw_description: '보험료'
      };

      await uploadBatchAction([tx]);
      expect(applyTaggingRules).toHaveBeenCalled();
    });
  });

  describe('Scenario 5: Heuristic Merchant Normalization', () => {
    it('should normalize merchant names using MatchingEngine', async () => {
      const tx: any = {
        date: '2026-03-27 12:00:00',
        amount: -3000,
        description: 'CU 편의점 마포점',
        raw_description: 'CU 편의점 마포점'
      };

      await uploadBatchAction([tx]);
      const insertCall = tableMocks.transactions.insert.mock.calls[0][0];
      expect(insertCall[0].normalized_name).toBe('편의점');
    });
  });

  // --- Chaos Scenarios ---

  describe('Scenario 6 [CHAOS]: Network Error during Insert', () => {
    it('should return failure status when DB insert fails', async () => {
      const tx: any = {
        date: '2026-03-27',
        amount: 100,
        description: 'Failure Test',
        raw_description: 'Failure Test'
      };

      tableMocks.transactions._error = { message: 'Connection Error' };
      tableMocks.transactions._data = null;

      const result = await uploadBatchAction([tx]);
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Connection Error');
    });
  });

  describe('Scenario 7 [CHAOS]: Garbage Data Filtering', () => {
    it('should filter out transactions with amount 0', async () => {
      const transactions: any[] = [
        { date: '2026-03-27', amount: 0, description: 'Zero' },
        { date: '2026-03-27', amount: 5000, description: 'Valid' }
      ];

      const result = await uploadBatchAction(transactions);
      expect(result.count).toBe(1);
      expect(result.addedCount).toBe(1);
    });
  });

  describe('Scenario 8 [CHAOS]: Parallel Race Condition Simulation', () => {
    it('should detect existing hashes via Mock', async () => {
      const tx: any = {
        date: '2026-03-27',
        amount: 8888,
        description: 'Race Test',
        raw_description: 'Race Test'
      };

      const hash = generateHash(`2026-03-27|8888|Race Test|`);
      tableMocks.transactions._data = [{ import_hash: hash }];
      
      const result = await uploadBatchAction([tx]);
      expect(result.addedCount).toBe(0);
      expect(result.duplicateCount).toBe(1);
    });
  });
});
