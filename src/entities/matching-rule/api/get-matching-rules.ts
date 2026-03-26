import { createClient } from '@/shared/api/supabase/client';
import { MatchingRuleWithConditions } from '../model/types';

export const getMatchingRules = async (): Promise<MatchingRuleWithConditions[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('income_matching_rules')
    .select('*')
    .order('usage_count', { ascending: false });

  if (error) {
    console.error('Error fetching matching rules:', error);
    throw error;
  }

  return (data || []) as unknown as MatchingRuleWithConditions[];
};
