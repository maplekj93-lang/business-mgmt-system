import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { importExcelTransactions } from '../api/importExcelTransactions';
import { createClient } from '@/shared/api/supabase/client';
import { generateImportHash } from '../lib/utils';
import type { ExcelTransactionRow } from '../model/types';

// Mock Supabase client and utils
vi.mock('@/shared/api/supabase/client', () => ({
  createClient: vi.fn(),
}));

vi.mock('../lib/utils', () => ({
  generateImportHash: vi.fn(),
  chunkArray: (arr: any[], size: number) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  },
}));

describe('importExcelTransactions - Concurrent Import & Race Condition Prevention', () => {
  let mockSupabase: any;
  let mockUpsertCall: any;

  beforeEach(() => {
    mockUpsertCall = vi.fn().mockReturnThis();

    mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        const query: any = {
          upsert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: vi.fn().mockImplementation(function (onFulfilled) {
            // Default response
            const result = { data: [], error: null };
            return Promise.resolve(onFulfilled ? onFulfilled(result) : result);
          }),
        };
        
        // Connect shared mock to query.upsert for tests that check its calls
        query.upsert = mockUpsertCall.mockImplementation(() => query);
        
        return query;
      }),
    };

    vi.mocked(createClient).mockReturnValue(mockSupabase);
    vi.mocked(generateImportHash).mockImplementation(
      async (date, assetId, amount, description) => {
        return `hash_${date}_${assetId}_${amount}_${description}`.replace(/\s+/g, '_');
      }
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('TOCTOU Prevention - DB-Level UNIQUE Constraint', () => {
    it('should prevent duplicate inserts via ignoreDuplicates=true (Concurrent Import)', async () => {
      // 시뮬레이션: 두 개의 동시 import 요청이 같은 import_hash를 가진 거래를 처리
      const row1: ExcelTransactionRow = {
        asset_id: 'asset-123',
        date: '2026-03-25',
        amount: 50000,
        description: '점심비',
        raw_description: '점심비',
        currency_code: 'KRW',
        foreign_amount: null,
      };

      const row2: ExcelTransactionRow = {
        asset_id: 'asset-123',
        date: '2026-03-25',
        amount: 50000,
        description: '점심비',
        raw_description: '점심비',
        currency_code: 'KRW',
        foreign_amount: null,
      };

      // 초회 import
      const result1 = await importExcelTransactions([row1], 'asset-123');
      expect(result1.inserted).toBe(0); // upsert에서 실제 삽입 건수는 0 (mock 응답)
      expect(result1.skipped).toBe(1); // ignoreDuplicates=true로 인해 skip 처리됨

      // 재import (동시성 시뮬레이션)
      const result2 = await importExcelTransactions([row2], 'asset-123');
      expect(result2.inserted).toBe(0);
      expect(result2.skipped).toBe(1);

      // ✅ 검증: upsert 호출 시 항상 ignoreDuplicates=true 옵션 사용
      expect(mockUpsertCall).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          onConflict: 'import_hash',
          ignoreDuplicates: true,
        })
      );
    });

    it('should handle upsert errors gracefully (DB Constraint Violation)', async () => {
      const row: ExcelTransactionRow = {
        asset_id: 'asset-123',
        date: '2026-03-25',
        amount: 50000,
        description: '점심비',
        raw_description: '점심비',
        currency_code: 'KRW',
        foreign_amount: null,
      };

      // upsert 실패 시나리오: DB constraint violation
      mockUpsertCall.mockImplementationOnce(() => ({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: {
            message: 'Duplicate key value violates unique constraint "transactions_user_id_import_hash_key"',
          },
        }),
      }));

      const result = await importExcelTransactions([row], 'asset-123');

      // 에러 발생 시 오류 메시지 기록, inserted=0 반환
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('청크 1/1 오류');
      expect(result.inserted).toBe(0);
    });

    it('should skip duplicate rows within same import batch', async () => {
      // 동일 import 배치 내에서 중복 감지
      const row1: ExcelTransactionRow = {
        asset_id: 'asset-123',
        date: '2026-03-25',
        amount: 50000,
        description: '점심비',
        raw_description: '점심비',
        currency_code: 'KRW',
        foreign_amount: null,
      };

      const row2: ExcelTransactionRow = {
        asset_id: 'asset-123',
        date: '2026-03-25',
        amount: 50000,
        description: '점심비',
        raw_description: '점심비',
        currency_code: 'KRW',
        foreign_amount: null,
      };

      const rows = [row1, row2];

      // Mock: 1개만 실제 삽입됨 (1개는 ignoreDuplicates로 스킵)
      mockUpsertCall.mockImplementationOnce(() => ({
        select: vi.fn().mockResolvedValue({
          data: [{ id: 'tx-1' }],
          error: null,
        }),
      }));

      const result = await importExcelTransactions(rows, 'asset-123');

      // inserted=1 (1개 삽입), skipped=1 (1개 스킵)
      expect(result.inserted).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Chunking & Bulk Upsert', () => {
    it('should chunk rows into CHUNK_SIZE (150) groups', async () => {
      // 300개 행 = 2개 청크 (150 + 150)
      const rows: ExcelTransactionRow[] = Array.from({ length: 300 }, (_, i) => ({
        asset_id: 'asset-123',
        date: '2026-03-25',
        amount: 10000 + i,
        description: `거래${i}`,
        raw_description: `거래${i}`,
        currency_code: 'KRW',
        foreign_amount: null,
      }));

      mockUpsertCall.mockImplementation(() => ({
        select: vi.fn().mockResolvedValue({
          data: Array.from({ length: 150 }, (_, i) => ({ id: `tx-${i}` })),
          error: null,
        }),
      }));

      const result = await importExcelTransactions(rows, 'asset-123');

      // ✅ 검증: upsert가 정확히 2번 호출됨 (300 / 150 = 2 chunks)
      expect(mockUpsertCall).toHaveBeenCalledTimes(2);

      // 각 청크마다 150건 처리
      const firstChunkCall = mockUpsertCall.mock.calls[0];
      const secondChunkCall = mockUpsertCall.mock.calls[1];
      expect(firstChunkCall[0].length).toBe(150);
      expect(secondChunkCall[0].length).toBe(150);

      // 총 inserted: 150 * 2 = 300
      expect(result.inserted).toBe(300);
    });

    it('should call select("id") after each upsert', async () => {
      const row: ExcelTransactionRow = {
        asset_id: 'asset-123',
        date: '2026-03-25',
        amount: 50000,
        description: '점심비',
        raw_description: '점심비',
        currency_code: 'KRW',
        foreign_amount: null,
      };

      mockUpsertCall.mockResolvedValueOnce({
        data: [{ id: 'tx-1' }],
        error: null,
      });

      await importExcelTransactions([row], 'asset-123');

      // ✅ 검증: upsert 후 select("id") 호출
      const selectMock = mockSupabase.from().select;
      expect(selectMock).toHaveBeenCalledWith('id');
    });
  });

  describe('Asset last_synced_at Update', () => {
    it('should update assets.last_synced_at on successful import', async () => {
      const row: ExcelTransactionRow = {
        asset_id: 'asset-123',
        date: '2026-03-25',
        amount: 50000,
        description: '점심비',
        raw_description: '점심비',
        currency_code: 'KRW',
        foreign_amount: null,
      };

      mockUpsertCall.mockResolvedValueOnce({
        data: [{ id: 'tx-1' }],
        error: null,
      });

      // assets 테이블의 update 체인 설정
      const eqMock = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'transactions') {
          return {
            upsert: mockUpsertCall,
            select: vi.fn().mockReturnThis(),
          };
        }
        if (table === 'assets') {
          return {
            update: vi.fn().mockReturnValue({ eq: eqMock }),
            eq: eqMock,
          };
        }
        return {};
      });

      const result = await importExcelTransactions([row], 'asset-123');

      // ✅ 검증: 성공 시 assets 테이블 업데이트 호출
      expect(result.inserted).toBe(1);
      expect(result.errors.length).toBe(0);
    });

    it('should skip assets.last_synced_at update if import has errors', async () => {
      const row: ExcelTransactionRow = {
        asset_id: 'asset-123',
        date: '2026-03-25',
        amount: 50000,
        description: '점심비',
        raw_description: '점심비',
        currency_code: 'KRW',
        foreign_amount: null,
      };

      mockUpsertCall.mockImplementationOnce(() => ({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }));

      const result = await importExcelTransactions([row], 'asset-123');

      // ✅ 검증: 에러 발생 시 assets 업데이트 스킵
      expect(result.errors.length).toBe(1);
      expect(result.inserted).toBe(0);
    });
  });

  describe('Data Preparation & Import Hash', () => {
    it('should generate import_hash from (date, asset_id, amount, description)', async () => {
      const row: ExcelTransactionRow = {
        asset_id: 'asset-456',
        date: '2026-03-26',
        amount: 100000,
        description: '카페 커피',
        raw_description: '카페 커피',
        currency_code: 'KRW',
        foreign_amount: null,
      };

      mockUpsertCall.mockResolvedValueOnce({
        data: [{ id: 'tx-1' }],
        error: null,
      });

      await importExcelTransactions([row], 'asset-456');

      // ✅ 검증: generateImportHash 호출 확인
      expect(vi.mocked(generateImportHash)).toHaveBeenCalledWith(
        '2026-03-26',
        'asset-456',
        100000,
        '카페 커피'
      );
    });

    it('should trim description and use raw_description as fallback', async () => {
      const row: ExcelTransactionRow = {
        asset_id: 'asset-123',
        date: '2026-03-25',
        amount: 50000,
        description: '  점심비  ', // 공백 포함
        raw_description: '점심식사',
        currency_code: 'KRW',
        foreign_amount: null,
      };

      mockUpsertCall.mockResolvedValueOnce({
        data: [{ id: 'tx-1' }],
        error: null,
      });

      await importExcelTransactions([row], 'asset-123');

      // ✅ 검증: description 트림 처리
      const upsertData = mockUpsertCall.mock.calls[0][0][0];
      expect(upsertData.description).toBe('점심비'); // 트림됨
      expect(upsertData.raw_description).toBe('점심식사');
    });

    it('should handle foreign currency fields (currency_code, foreign_amount)', async () => {
      const row: ExcelTransactionRow = {
        asset_id: 'asset-123',
        date: '2026-03-25',
        amount: 1000,
        description: 'USD 거래',
        raw_description: 'USD 거래',
        currency_code: 'USD',
        foreign_amount: 1.23,
      };

      mockUpsertCall.mockResolvedValueOnce({
        data: [{ id: 'tx-1' }],
        error: null,
      });

      await importExcelTransactions([row], 'asset-123');

      // ✅ 검증: 외화 필드 포함
      const upsertData = mockUpsertCall.mock.calls[0][0][0];
      expect(upsertData.currency_code).toBe('USD');
      expect(upsertData.foreign_amount).toBe(1.23);
    });
  });

  describe('Error Handling & Resilience', () => {
    it('should continue processing after partial chunk failure', async () => {
      // 2개 청크: 첫 번째 실패, 두 번째 성공
      const rows: ExcelTransactionRow[] = Array.from({ length: 300 }, (_, i) => ({
        asset_id: 'asset-123',
        date: '2026-03-25',
        amount: 10000 + i,
        description: `거래${i}`,
        raw_description: `거래${i}`,
        currency_code: 'KRW',
        foreign_amount: null,
      }));

      mockUpsertCall.mockImplementationOnce(() => ({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Chunk 1 error' },
        }),
      }));
      mockUpsertCall.mockImplementationOnce(() => ({
        select: vi.fn().mockResolvedValue({
          data: Array.from({ length: 150 }, (_, i) => ({ id: `tx-${i}` })),
          error: null,
        }),
      }));

      const result = await importExcelTransactions(rows, 'asset-123');

      // ✅ 검증: 첫 번째 청크 실패, 두 번째 청크 성공
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('청크 1/2 오류');
      expect(result.inserted).toBe(150); // 두 번째 청크만 성공
      expect(result.skipped).toBe(150); // 첫 번째 청크 150개
    });

    it('should return result with empty data on transaction fetch error', async () => {
      const row: ExcelTransactionRow = {
        asset_id: 'asset-123',
        date: '2026-03-25',
        amount: 50000,
        description: '점심비',
        raw_description: '점심비',
        currency_code: 'KRW',
        foreign_amount: null,
      };

      // 트랜잭션 조회 실패 (select 후 에러)
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'transactions') {
          return {
            upsert: mockUpsertCall.mockImplementationOnce(() => ({
              select: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Network error' },
              }),
            })),
            select: vi.fn().mockReturnThis(),
          };
        }
        return {};
      });

      const result = await importExcelTransactions([row], 'asset-123');

      // ✅ 검증: 에러 반환
      expect(result.errors.length).toBe(1);
      expect(result.inserted).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty array input', async () => {
      const result = await importExcelTransactions([], 'asset-123');

      expect(result.inserted).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors.length).toBe(0);
      // upsert는 호출되지 않음 (빈 배열)
      expect(mockUpsertCall).not.toHaveBeenCalled();
    });

    it('should handle very large amounts', async () => {
      const row: ExcelTransactionRow = {
        asset_id: 'asset-123',
        date: '2026-03-25',
        amount: 999999999999.99,
        description: '대액 거래',
        raw_description: '대액 거래',
        currency_code: 'KRW',
        foreign_amount: null,
      };

      mockUpsertCall.mockResolvedValueOnce({
        data: [{ id: 'tx-1' }],
        error: null,
      });

      const result = await importExcelTransactions([row], 'asset-123');

      // ✅ 검증: 대액 처리 성공
      expect(result.inserted).toBe(1);
      const upsertData = mockUpsertCall.mock.calls[0][0][0];
      expect(upsertData.amount).toBe(999999999999.99);
    });

    it('should handle zero and negative amounts', async () => {
      const rows: ExcelTransactionRow[] = [
        {
          asset_id: 'asset-123',
          date: '2026-03-25',
          amount: 0,
          description: '영액',
          raw_description: '영액',
          currency_code: 'KRW',
          foreign_amount: null,
        },
        {
          asset_id: 'asset-123',
          date: '2026-03-25',
          amount: -50000,
          description: '환불',
          raw_description: '환불',
          currency_code: 'KRW',
          foreign_amount: null,
        },
      ];

      mockUpsertCall.mockImplementationOnce(() => ({
        select: vi.fn().mockResolvedValue({
          data: [{ id: 'tx-1' }, { id: 'tx-2' }],
          error: null,
        }),
      }));

      const result = await importExcelTransactions(rows, 'asset-123');

      // ✅ 검증: 영액, 음수 처리 성공
      expect(result.inserted).toBe(2);
    });

    it('should handle special characters in description', async () => {
      const row: ExcelTransactionRow = {
        asset_id: 'asset-123',
        date: '2026-03-25',
        amount: 50000,
        description: "카페 ☕ 커피 (이모지) & 'quotes' \"double\"",
        raw_description: "카페 ☕ 커피 (이모지) & 'quotes' \"double\"",
        currency_code: 'KRW',
        foreign_amount: null,
      };

      mockUpsertCall.mockResolvedValueOnce({
        data: [{ id: 'tx-1' }],
        error: null,
      });

      const result = await importExcelTransactions([row], 'asset-123');

      // ✅ 검증: 특수 문자 처리 성공
      expect(result.inserted).toBe(1);
      const upsertData = mockUpsertCall.mock.calls[0][0][0];
      expect(upsertData.description).toContain('☕');
    });
  });

  describe('Success Summary', () => {
    it('should return correct success summary', async () => {
      // 300 rows: chunk 1 (150) success, chunk 2 (150) success
      const rows: ExcelTransactionRow[] = Array.from({ length: 300 }, (_, i) => ({
        asset_id: 'asset-123',
        date: '2026-03-25',
        amount: 10000 + i,
        description: `거래${i}`,
        raw_description: `거래${i}`,
        currency_code: 'KRW',
        foreign_amount: null,
      }));

      mockUpsertCall.mockImplementationOnce(() => ({
        select: vi.fn().mockResolvedValue({
          data: Array.from({ length: 140 }, (_, i) => ({ id: `tx-${i}` })),
          error: null,
        }),
      }));
      mockUpsertCall.mockImplementationOnce(() => ({
        select: vi.fn().mockResolvedValue({
          data: Array.from({ length: 145 }, (_, i) => ({ id: `tx-${i}` })),
          error: null,
        }),
      }));

      const result = await importExcelTransactions(rows, 'asset-123');

      // ✅ 검증: 올바른 summary 반환
      expect(result.inserted).toBe(285); // 140 + 145
      expect(result.skipped).toBe(15); // (150-140) + (150-145)
      expect(result.errors.length).toBe(0);
    });
  });
});
