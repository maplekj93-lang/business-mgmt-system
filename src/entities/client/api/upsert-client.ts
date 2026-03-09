'use server'
import { createClient } from '@/shared/api/supabase/server';
import type { Client } from '../model/types';

export async function upsertClient(
    payload: Omit<Client, 'created_at' | 'total_revenue' | 'project_count' | 'last_project_at'>
) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('clients')
        .upsert(payload as any)
        .select()
        .single();

    if (error) {
        console.error('Failed to upsert client:', error);
        throw new Error('거래처 정보를 저장하지 못했습니다.');
    }

    return data;
}
