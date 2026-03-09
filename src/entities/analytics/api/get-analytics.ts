'use server'

import { createClient } from '@/shared/api/supabase/server';
import { AnalyticsData } from '../model/types';

export async function getAdvancedAnalytics(
    params: { mode: 'personal' | 'business' | 'total'; year: number; month: number }
): Promise<AnalyticsData | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await (supabase.rpc as any)('get_advanced_analytics', {
        p_mode: params.mode,
        p_month: params.month,
        p_year: params.year
    });

    if (error) {
        console.error('getAdvancedAnalytics Error:', error);
        return null;
    }

    const result: any = data && Array.isArray(data) && data[0] ? data[0] : null;

    if (!result) {
        return {
            dailyTrend: [],
            categoryDistribution: [],
            summary: { total_income: 0, total_expense: 0, transaction_count: 0 }
        };
    }

    return {
        dailyTrend: result.daily_trend || [],
        categoryDistribution: result.category_distribution || [],
        summary: result.summary || { total_income: 0, total_expense: 0, transaction_count: 0 }
    };
}
