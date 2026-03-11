'use server';

import { createClient } from '@/shared/api/supabase/server';

/**
 * 사용자가 미분류 내역의 카테고리를 수동으로 지정할 때,
 * 해당 키워드를 향후 사용할 자동 분류 룰로 등록합니다.
 */
export async function registerTaggingRule(
  keyword: string,
  categoryId: number,
  isBusiness: boolean = false,
  matchType: 'exact' | 'contains' = 'exact',
  priority: number = 10,
  businessTag?: string
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !keyword || !categoryId) {
    throw new Error('Invalid input or unauthorized.');
  }

  const { error } = await supabase
    .from('mdt_allocation_rules')
    .insert({
      user_id: user.id,
      keyword,
      category_id: categoryId,
      is_business: isBusiness,
      match_type: matchType,
      priority,
      business_tag: businessTag || null,
    });

  if (error) {
    console.error('Failed to register tagging rule:', error);
    throw new Error('Failed to register tagging rule');
  }
}
