'use server';

import { createClient } from '@/shared/api/supabase/server';
import { suggestCategoryBulk } from './suggest-category-bulk';
import { ApplyRulesResult } from '../model/ai-classification';

/**
 * 주어진 미분류 트랜잭션 ID 목록에 대해 스마트 태깅 룰을 일괄 적용합니다. (N+1 최적화 버전)
 */
export async function applyTaggingRules(
  transactionIds: string[]
): Promise<ApplyRulesResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !transactionIds || transactionIds.length === 0) {
    return { auto_applied: 0, suggested: 0, unmatched: 0 };
  }

  // 1. 대상 거래 데이터 조회 (고정지출 매칭을 위해 date, amount 추가)
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('id, description, date, amount')
    .in('id', transactionIds)
    .eq('user_id', user.id)
    .eq('manual_override', false);

  if (txError || !transactions || transactions.length === 0) {
    console.error('Failed to fetch transactions for applying rules:', txError);
    return { auto_applied: 0, suggested: 0, unmatched: 0 };
  }

  // 2. 고정지출 규칙 조회
  const { data: fixedRules } = await supabase
    .from('fixed_expense_rules')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true);

  // 3. 벌크 분류 추천 실행 (N+1 쿼리 없음)
  const descriptions = transactions.map(tx => tx.description || '').filter(Boolean);
  const suggestionMap = await suggestCategoryBulk(descriptions);

  let autoAppliedCount = 0;
  let suggestedCount = 0;
  let unmatchedCount = 0;

  const updates: any[] = [];

  // 4. 결과 분류 및 업데이트 목록 생성
  for (const tx of transactions) {

    let applied = false;

    // 4-1. 키워드 기반 추천 확인
    const suggestion = tx.description ? suggestionMap.get(tx.description) : null;

    if (suggestion && suggestion.confidence === 'high') {
      updates.push({
        id: tx.id,
        category_id: suggestion.category_id,
        allocation_status: suggestion.is_business ? 'business_allocated' : 'personal',
        excluded_from_personal: suggestion.is_business ? true : false,
      });
      autoAppliedCount++;
      applied = true;
    }

    // 4-2. 고정지출 규칙 확인 (키워드로 분류되지 않았을 때만)
    if (!applied && fixedRules && fixedRules.length > 0) {
      const txDate = new Date(tx.date);
      const txAmount = Math.abs(Number(tx.amount));

      for (const rule of fixedRules) {
        if (Math.abs(Number(rule.amount)) !== txAmount) continue;

        // 날짜 차이 계산 (± tolerance_days)
        // 해당 월의 rule.day_of_month와 비교
        const checkDates = [
          new Date(txDate.getFullYear(), txDate.getMonth(), rule.day_of_month),
          new Date(txDate.getFullYear(), txDate.getMonth() - 1, rule.day_of_month),
          new Date(txDate.getFullYear(), txDate.getMonth() + 1, rule.day_of_month),
        ];

        const isMatch = checkDates.some(targetDate => {
          const diffDays = Math.abs(txDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24);
          return diffDays <= rule.tolerance_days;
        });

        if (isMatch) {
          updates.push({
            id: tx.id,
            category_id: rule.category_id,
            owner_type: rule.owner_type,
          });
          autoAppliedCount++;
          applied = true;
          break;
        }
      }
    }

    if (!applied) {
      if (suggestion) {
        suggestedCount++;
      } else {
        unmatchedCount++;
      }
    }
  }

  // 5. 벌크 업데이트 실행
  if (updates.length > 0) {
    const { error: updateError } = await supabase
      .from('transactions')
      .upsert(updates);

    if (updateError) {
      console.error('Failed to bulk update transactions:', updateError);
      return { auto_applied: 0, suggested: transactionIds.length - unmatchedCount, unmatched: unmatchedCount };
    }
  }

  return {
    auto_applied: autoAppliedCount,
    suggested: suggestedCount,
    unmatched: unmatchedCount,
  };
}
