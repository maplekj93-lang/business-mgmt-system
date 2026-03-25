import { createClient } from '@/shared/api/supabase/client';

/**
 * '카카오페이 머니' 자산 ID 조회
 */
export const getKakaoPayAssetId = async (): Promise<string | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('assets')
    .select('id')
    .eq('name', '카카오페이 머니')
    .single();

  if (error || !data) return null;
  return data.id;
};
