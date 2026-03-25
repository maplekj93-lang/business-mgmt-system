'use server'
import { createClient } from '@/shared/api/supabase/server';
import type { Client } from '../model/types';

/**
 * Fetches clients with aggregated statistics (LTV, project count, last project date)
 * using the Supabase RPC function 'get_clients_with_stats'.
 */
export async function getClientsWithStats(): Promise<Client[]> {
    const supabase = await createClient();
    
    // RPC 호출: get_clients_with_stats()
    const { data, error } = await supabase.rpc('get_clients_with_stats');

    if (error) {
        console.error('Failed to fetch clients with stats:', error);
        throw new Error('거래처 통계 정보를 불러오지 못했습니다.');
    }

    // 데이터 변환 (snake_case columns mapped by RPC already, but ensure type safety)
    return (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        business_number: item.business_number,
        files: item.files || [],
        contacts: item.contacts || [],
        created_at: item.created_at,
        project_count: Number(item.project_count || 0),
        total_revenue: Number(item.total_revenue || 0),
        last_project_at: item.last_project_at,
    })) as Client[];
}
