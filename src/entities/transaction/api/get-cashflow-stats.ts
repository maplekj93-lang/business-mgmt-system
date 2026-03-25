'use server'

import { createClient } from '@/shared/api/supabase/server';
import { CashflowInsightSchema } from '../model/cashflow';

/**
 * Fetches aggregated cashflow stats for the dashboard.
 * 
 * @param startDate YYYY-MM-DD
 * @param endDate YYYY-MM-DD
 * @param ownerId Optional owner identifier for filtering (kwangjun, euiyoung, joint, household)
 */
export async function getCashflowStats(startDate: string, endDate: string, ownerId: string = 'all') {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: '인증되지 않은 사용자입니다.' };
    }

    try {
        const { data, error } = await supabase.rpc('calculate_cashflow_stats', {
            p_user_id: user.id,
            p_start_date: startDate,
            p_end_date: endDate,
            p_owner_id: ownerId === 'all' ? null : ownerId
        });

        if (error) {
            console.error('RPC Error (calculate_cashflow_stats):', error);
            return { success: false, error: '데이터를 계산하는 중 서버 오류가 발생했습니다.' };
        }

        // RPC returns jsonb directly
        const validation = CashflowInsightSchema.safeParse(data);
        if (!validation.success) {
            console.error('Data Validation Error (CashflowInsight):', validation.error);
            return { success: false, error: '데이터 형식이 올바르지 않습니다.' };
        }

        return { success: true, data: validation.data };
    } catch (error: any) {
        console.error('Failed to get cashflow stats:', error);
        return { success: false, error: error.message || '현금흐름 통계를 가져오는 중 오류가 발생했습니다.' };
    }
}
