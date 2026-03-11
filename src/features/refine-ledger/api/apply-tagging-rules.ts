'use server';

import { createClient } from '@/shared/api/supabase/server';
import { suggestCategory } from './suggest-category';

export interface ApplyRulesResult {
  auto_applied: number;
  suggested: number;
  unmatched: number;
}

/**
 * 주어진 미분류 트랜잭션 ID 목록에 대해 스마트 태깅 룰을 일괄 적용합니다.
 * confidence === 'high' (Exact Match) 인 경우에만 자동으로 DB 업데이트 (적용) 하며,
 * 나머지는 제안(suggest) 상태로만 카운팅합니다.
 */
export async function applyTaggingRules(
  transactionIds: string[]
): Promise<ApplyRulesResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !transactionIds || transactionIds.length === 0) {
    return { auto_applied: 0, suggested: 0, unmatched: 0 };
  }

  // 대상 거래 조회
  const { data: txs, error: txError } = await supabase
    .from('transactions')
    .select('id, description')
    .in('id', transactionIds)
    .eq('user_id', user.id);

  if (txError || !txs) {
    console.error('Failed to fetch transactions for applying rules:', txError);
    return { auto_applied: 0, suggested: 0, unmatched: 0 };
  }

  let autoAppliedCount = 0;
  let suggestedCount = 0;
  let unmatchedCount = 0;

  for (const tx of txs) {
    if (!tx.description) {
      unmatchedCount++;
      continue;
    }

    const suggestion = await suggestCategory(tx.description);

    if (suggestion) {
      if (suggestion.confidence === 'high') {
        // 자동 적용 확정
        const { error: updateError } = await supabase
          .from('transactions')
          .update({
             category_id: suggestion.category_id,
             allocation_status: suggestion.is_business ? 'business_allocated' : 'personal',
             excluded_from_personal: suggestion.is_business ? true : false,
          })
          .eq('id', tx.id);

        if (!updateError) {
          autoAppliedCount++;
        } else {
          suggestedCount++; // 실패 시 그냥 제안 카운트로
        }
      } else {
        // 제안 수준이면 자동 적용 안함
        suggestedCount++;
      }
    } else {
      unmatchedCount++;
    }
  }

  return {
    auto_applied: autoAppliedCount,
    suggested: suggestedCount,
    unmatched: unmatchedCount,
  };
}
