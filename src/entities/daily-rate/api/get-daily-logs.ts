'use server'
import { createClient } from '@/shared/api/supabase/server';
import type { DailyRateLog } from '../model/types';

/** 월별 일당 로그 조회 (YYYY-MM 형식) */
export async function getDailyRateLogs(yearMonth?: string): Promise<DailyRateLog[]> {
    const supabase = await createClient();
    let query = supabase
        .from('daily_rate_logs')
        .select(`
      *,
      client:clients(id, name),
      crew_payments(*),
      site_expenses(*)
    `)
        .order('work_date', { ascending: false });

    if (yearMonth) {
        const [y, m] = yearMonth.split('-').map(Number);
        const nextMonth = m === 12
            ? `${y + 1}-01-01`
            : `${y}-${String(m + 1).padStart(2, '0')}-01`;

        query = query
            .gte('work_date', `${yearMonth}-01`)
            .lt('work_date', nextMonth);
    }

    const { data, error } = await query;
    if (error) {
        console.error('Failed to fetch daily rate logs:', error);
        throw new Error('일당 기록을 불러오지 못했습니다.');
    }

    return (data || []) as unknown as DailyRateLog[];
}
