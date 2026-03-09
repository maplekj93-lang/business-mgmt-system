'use server'
import { createClient } from '@/shared/api/supabase/server';
import type { Database } from '@/shared/types/database.types';

type BusinessProfile = Database['public']['Tables']['business_profiles']['Row'];

export async function getBusinessProfiles(): Promise<BusinessProfile[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .order('owner_type');

    if (error) {
        console.error('Failed to fetch business profiles:', error);
        throw new Error('사업 프로필을 불러오지 못했습니다.');
    }

    return data || [];
}

export async function updateBusinessProfile(id: string, payload: Partial<BusinessProfile>) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('business_profiles')
        .update(payload as any)
        .eq('id', id);

    if (error) {
        console.error('Failed to update business profile:', error);
        throw new Error('사업 프로필 수정 중 오류가 발생했습니다.');
    }
}
