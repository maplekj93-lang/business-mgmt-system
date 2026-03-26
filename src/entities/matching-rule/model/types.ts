import { Database } from '@/shared/types/database.types';

export type MatchingRule = Database['public']['Tables']['income_matching_rules']['Row'];

export interface MatchingConditions {
  day_of_range?: [number, number];
  amount_condition?: {
    type: 'variance' | 'range';
    base?: number;
    percentage?: number;
    min?: number;
    max?: number;
  };
}

export type MatchingRuleWithConditions = Omit<MatchingRule, 'conditions'> & {
  conditions: MatchingConditions;
};
