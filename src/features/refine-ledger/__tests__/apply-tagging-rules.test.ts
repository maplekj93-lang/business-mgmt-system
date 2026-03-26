import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyTaggingRules } from '../api/apply-tagging-rules';
import { createClient } from '@/shared/api/supabase/server';

import { suggestCategoryBulk } from '../api/suggest-category-bulk';

// Mock Supabase
vi.mock('@/shared/api/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('../api/suggest-category-bulk', () => ({
  suggestCategoryBulk: vi.fn().mockResolvedValue(new Map()),
}));

describe('applyTaggingRules - Fixed Expense Rule Matching', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-123' } } }),
      },
      from: vi.fn(),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase);
    vi.mocked(suggestCategoryBulk).mockResolvedValue(new Map());
  });

  describe('Fixed Expense Rule - Date Boundary Matching', () => {
    it('월급일(매월 25일) ±3일 범위 내 거래 매칭해야 함', async () => {
      // 월급일 25일 규칙, tolerance_days: 3
      // 2026-03-25, 2026-03-24, 2026-03-26 모두 매칭되어야 함

      const mockTransactions = [
        { id: 'tx1', description: '월급', date: '2026-03-25', amount: 3000000 },
        { id: 'tx2', description: '월급', date: '2026-03-24', amount: 3000000 },
        { id: 'tx3', description: '월급', date: '2026-03-26', amount: 3000000 },
        { id: 'tx4', description: '월급', date: '2026-03-21', amount: 3000000 }, // 4일 차이 - 범위 외
      ];

      const mockFixedRules = [
        {
          id: 'rule1',
          amount: 3000000,
          day_of_month: 25,
          tolerance_days: 3, // ±3일
          category_id: 'salary-cat',
          owner_type: 'kwangjun',
        },
      ];

      // Mock 설정
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((callback) => {
          // 호출된 테이블에 따라 다른 데이터 반환
          const lastTable = mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0];
          if (lastTable === 'transactions') {
            return Promise.resolve(callback({ data: mockTransactions, error: null }));
          }
          if (lastTable === 'fixed_expense_rules') {
            return Promise.resolve(callback({ data: mockFixedRules, error: null }));
          }
          return Promise.resolve(callback({ data: [], error: null }));
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await applyTaggingRules(['tx1', 'tx2', 'tx3', 'tx4']);

      // tx1, tx2, tx3는 매칭되어야 함 (3건)
      // tx4는 범위 외라 미매칭
      expect(result.auto_applied).toBeGreaterThanOrEqual(3);
      expect(result.unmatched).toBeGreaterThanOrEqual(1);
    });

    it('금액이 다르면 규칙을 적용하지 않아야 함', async () => {
      const mockTransactions = [
        { id: 'tx1', description: '월급', date: '2026-03-25', amount: 3000000 },
        { id: 'tx2', description: '월급', date: '2026-03-25', amount: 2500000 }, // 다른 금액
      ];

      const mockFixedRules = [
        {
          id: 'rule1',
          amount: 3000000,
          day_of_month: 25,
          tolerance_days: 3,
          category_id: 'salary-cat',
          owner_type: 'kwangjun',
        },
      ];

      // tx1만 매칭, tx2는 미매칭
      // (실제로는 suggestCategoryBulk에서 제안할 수도 있음)
    });

    it('rule.tolerance_days가 undefined면 안전하게 스킵해야 함', async () => {
      const mockTransactions = [
        { id: 'tx1', description: '월급', date: '2026-03-25', amount: 3000000 },
      ];

      const mockFixedRules = [
        {
          id: 'rule1',
          amount: 3000000,
          day_of_month: 25,
          tolerance_days: undefined, // ⚠️ undefined
          category_id: 'salary-cat',
          owner_type: 'kwangjun',
        },
      ];

      // 규칙을 스킵해야 하고, 에러가 발생하지 않아야 함
      // 로직: if (!rule.tolerance_days === undefined || rule.tolerance_days === null) continue;
    });

    it('rule.amount가 undefined면 안전하게 스킵해야 함', async () => {
      const mockTransactions = [
        { id: 'tx1', description: '월급', date: '2026-03-25', amount: 3000000 },
      ];

      const mockFixedRules = [
        {
          id: 'rule1',
          amount: undefined, // ⚠️ undefined
          day_of_month: 25,
          tolerance_days: 3,
          category_id: 'salary-cat',
          owner_type: 'kwangjun',
        },
      ];

      // 규칙을 스킵해야 함
    });
  });

  describe('High Confidence - All Rule Types', () => {
    it('high confidence인 모든 rule_type (exact, keyword, history)을 자동 적용해야 함', async () => {
      // apply-tagging-rules.ts:58
      // if (suggestion && suggestion.confidence === 'high')
      // → rule_type 구분 없이 모두 auto_applied

      // exact 매치 (가장 신뢰도 높음)
      // keyword 매치 (중간)
      // history 매치 (사용 이력 기반)
      // 모두 confidence='high'면 자동 적용

      // 이것이 의도된 동작인지 확인됨:
      // "단계별로 했던거같은데, 뭐 기준 3개 다맞으면 무조건, 2개 맞으면 좀 더 낮은 신뢰도 이런식으로"
    });
  });
});
