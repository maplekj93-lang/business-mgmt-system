'use server';

import { createClient } from '@/shared/api/supabase/server';

export type RuleType = 'exact' | 'keyword' | 'history';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface SuggestionResult {
  category_id: number;
  category_name: string;
  confidence: ConfidenceLevel;
  rule_type: RuleType;
  is_business?: boolean;
}

/**
 * 미분류 거래 1건의 description으로 카테고리를 추천 (3단계 룰 엔진)
 * 1. Exact Match (가장 높은 우선순위)
 * 2. Contains Match (키워드 포함)
 * 3. History Match (과거의 사용자 분류 패턴)
 */
export async function suggestCategory(
  description: string
): Promise<SuggestionResult | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !description) return null;

  // 1 & 2. Allocation Rules 조회 (Exact & Contains)
  // priority 오름차순 (작을수록 우선) -> id 오름차순 (먼저 등록된 것 우선)
  const { data: rules } = await supabase
    .from('mdt_allocation_rules')
    .select(`
      id,
      keyword,
      match_type,
      priority,
      category_id,
      is_business,
      mdt_categories ( name )
    `)
    .eq('user_id', user.id)
    .order('priority', { ascending: true })
    .order('id', { ascending: true });

  if (rules && rules.length > 0) {
    // 1단계: Exact Match 검사
    const exactMatch = rules.find((r) => r.match_type === 'exact' && r.keyword === description);
    if (exactMatch && exactMatch.category_id) {
      return {
        category_id: exactMatch.category_id,
        category_name: (exactMatch.mdt_categories as any)?.name || '알 수 없음',
        confidence: 'high',
        rule_type: 'exact',
        is_business: exactMatch.is_business || false,
      };
    }

    // 2단계: Contains Match 검사
    const containsMatch = rules.find((r) => r.match_type === 'contains' && description.includes(r.keyword));
    if (containsMatch && containsMatch.category_id) {
      return {
        category_id: containsMatch.category_id,
        category_name: (containsMatch.mdt_categories as any)?.name || '알 수 없음',
        confidence: 'medium',
        rule_type: 'keyword',
        is_business: containsMatch.is_business || false,
      };
    }
  }

  // 3단계: History Match (과거 거래 내역 기반)
  // 동일한 description을 가진 내역 중 가장 자주 분류된 카테고리를 찾음
  const { data: history } = await supabase
    .from('transactions')
    .select('category_id, mdt_categories(name)')
    .eq('user_id', user.id)
    .eq('description', description)
    .not('category_id', 'is', null)
    .limit(10);

  if (history && history.length > 0) {
    const frequency: Record<number, { count: number; name: string }> = {};
    history.forEach((tx) => {
      if (!tx.category_id) return;
      if (!frequency[tx.category_id]) {
        frequency[tx.category_id] = { count: 0, name: (tx.mdt_categories as any)?.name || '알 수 없음' };
      }
      frequency[tx.category_id].count++;
    });

    let bestCategory = 0;
    let maxCount = 0;
    for (const cat in frequency) {
      if (frequency[cat].count > maxCount) {
        maxCount = frequency[cat].count;
        bestCategory = Number(cat);
      }
    }

    if (bestCategory !== 0) {
      // 5번 이상 동일하게 분류했으면 medium, 그 외에는 low
      const conf = maxCount >= 5 ? 'medium' : 'low';
      return {
        category_id: bestCategory,
        category_name: frequency[bestCategory].name,
        confidence: conf,
        rule_type: 'history',
      };
    }
  }

  return null;
}
