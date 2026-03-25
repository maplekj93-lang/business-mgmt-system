'use server';

import { createClient } from '@/shared/api/supabase/server';
import { SuggestionResult, ConfidenceLevel, RuleType } from './suggest-category';

/**
 * 대량의 미분류 거래 내역에 대해 스마트 태깅 룰을 일괄 매칭합니다. (N+1 문제 해결)
 * @param descriptions 미분류 거래의 원본 내역(raw description) 배열
 */
export async function suggestCategoryBulk(
  descriptions: string[]
): Promise<Map<string, SuggestionResult>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const resultMap = new Map<string, SuggestionResult>();
  if (!user || descriptions.length === 0) return resultMap;

  // 고유한 설명값만 추출 (중복 매칭 방지)
  const uniqueDescriptions = Array.from(new Set(descriptions.map(d => d.trim())));
  const cleanToOriginal = new Map<string, string>();
  const cleanDescs = uniqueDescriptions.map(d => {
    const clean = d.toLowerCase();
    cleanToOriginal.set(clean, d);
    return clean;
  });

  // 1. 전체 할당 규칙(Allocation Rules) 로드 (1회 쿼리)
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

  // 2. 과거 분류 이력(History) 벌크 집계 (1회 쿼리)
  const { data: historyRows } = await supabase
    .from('transactions')
    .select('description, category_id, mdt_categories(name)')
    .eq('user_id', user.id)
    .in('description', uniqueDescriptions)
    .not('category_id', 'is', null);

  // History 데이터를 Map으로 가공 (최빈값 찾기)
  const historyStats = new Map<string, Map<number, { count: number; name: string }>>();
  historyRows?.forEach(row => {
    if (!row.description || !row.category_id) return;
    const desc = row.description;
    const catMap = historyStats.get(desc) || new Map<number, { count: number; name: string }>();
    const stats = catMap.get(row.category_id) || { count: 0, name: (row.mdt_categories as any)?.name || '알 수 없음' };
    stats.count++;
    catMap.set(row.category_id, stats);
    historyStats.set(desc, catMap);
  });

  const historyBestMap = new Map<string, { category_id: number; category_name: string; count: number }>();
  historyStats.forEach((catMap, desc) => {
    let best = { category_id: 0, category_name: '', count: 0 };
    catMap.forEach((stats, id) => {
      if (stats.count > best.count) {
        best = { category_id: id, category_name: stats.name, count: stats.count };
      }
    });
    if (best.category_id !== 0) historyBestMap.set(desc, best);
  });

  // 3. 인메모리 매칭 루프
  for (const originalDesc of uniqueDescriptions) {
    const cleanDesc = originalDesc.toLowerCase();

    if (rules && rules.length > 0) {
      // 1단계: Exact Match (대소문자 무시, 정규화된 키워드 비교)
      const exact = rules.find(r => 
        r.match_type === 'exact' && 
        r.keyword.trim().toLowerCase() === cleanDesc
      );
      if (exact && exact.category_id) {
        resultMap.set(originalDesc, {
          category_id: exact.category_id,
          category_name: (exact.mdt_categories as any)?.name || '알 수 없음',
          confidence: 'high',
          rule_type: 'exact',
          is_business: exact.is_business || false,
        });
        continue;
      }

      // 2단계: Contains Match (대소문자 무시, priority 순 정렬 보장)
      const contains = rules
        .filter(r => r.match_type === 'contains')
        .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999)) // 명시적 정렬
        .find(r => 
          cleanDesc.includes(r.keyword.trim().toLowerCase())
        );

      if (contains && contains.category_id) {
        resultMap.set(originalDesc, {
          category_id: contains.category_id,
          category_name: (contains.mdt_categories as any)?.name || '알 수 없음',
          confidence: 'medium',
          rule_type: 'keyword',
          is_business: contains.is_business || false,
        });
        continue;
      }
    }

    // 3단계: History Match
    const history = historyBestMap.get(originalDesc);
    if (history) {
      resultMap.set(originalDesc, {
        category_id: history.category_id,
        category_name: history.category_name,
        confidence: history.count >= 5 ? 'medium' : 'low',
        rule_type: 'history',
      });
    }
  }

  return resultMap;
}
