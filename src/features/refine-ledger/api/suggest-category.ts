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

  // 1. 전처리 (Trim + LowerCase)
  const cleanDesc = description.trim().toLowerCase();

  // 1 & 2. Allocation Rules 조회 (Exact & Contains)
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
    // 1단계: Exact Match 검사 (대소문자 무시, 정규화된 키워드 비교)
    const exactMatch = rules.find((r) => 
      r.match_type === 'exact' && 
      r.keyword.trim().toLowerCase() === cleanDesc
    );
    if (exactMatch && exactMatch.category_id) {
      return {
        category_id: exactMatch.category_id,
        category_name: (exactMatch.mdt_categories as any)?.name || '알 수 없음',
        confidence: 'high',
        rule_type: 'exact',
        is_business: exactMatch.is_business || false,
      };
    }

    // 2단계: Contains Match 검사 (대소문자 무시, priority 순 정렬 보장)
    const containsMatch = rules
      .filter(r => r.match_type === 'contains')
      .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999)) // 명시적 정렬
      .find((r) => 
        cleanDesc.includes(r.keyword.trim().toLowerCase())
      );

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
  // 정규화된 description으로 조회하거나 원본으로 조회 후 결과 매칭
  const { data: history } = await supabase
    .from('transactions')
    .select('category_id, mdt_categories(name)')
    .eq('user_id', user.id)
    .eq('description', description) // DB 인덱스 효율을 위해 원본 우선 사용
    .not('category_id', 'is', null)
    .limit(15);

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
