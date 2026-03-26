import { createClient } from '@/shared/api/supabase/client';
import { MatchingConditions, MatchingRuleWithConditions } from '../model/types';

interface UpdateMatchingRuleParams {
  id: string;
  sender_name?: string;
  project_keyword?: string;
  is_active?: boolean;
  is_locked?: boolean;
  conditions?: MatchingConditions;
  confidence_boost?: number;
}

export const updateMatchingRule = async (params: UpdateMatchingRuleParams): Promise<MatchingRuleWithConditions> => {
  const supabase = createClient();
  const { id, ...updates } = params;

  const { data, error } = await supabase
    .from('income_matching_rules')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating matching rule:', error);
    throw error;
  }

  return data as unknown as MatchingRuleWithConditions;
};
