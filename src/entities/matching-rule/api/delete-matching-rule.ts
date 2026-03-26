import { createClient } from '@/shared/api/supabase/client';

export const deleteMatchingRule = async (id: string): Promise<void> => {
  const supabase = createClient();
  const { error } = await supabase
    .from('income_matching_rules')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting matching rule:', error);
    throw error;
  }
};
