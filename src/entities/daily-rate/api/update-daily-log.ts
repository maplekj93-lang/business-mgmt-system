'use server'
import { createClient } from '@/shared/api/supabase/server';
import type { DailyRateLog, CrewPayment, SiteExpense } from '../model/types';

interface UpdateDailyLogInput {
    id: string;
    log: Partial<Omit<DailyRateLog, 'id' | 'amount_net' | 'created_at' | 'client' | 'crew_payments' | 'site_expenses'>>;
    crew?: Omit<CrewPayment, 'id' | 'daily_rate_log_id' | 'amount_net'>[];
    expenses?: Omit<SiteExpense, 'id' | 'daily_rate_log_id'>[];
}

export async function updateDailyLog({ id, log, crew = [], expenses = [] }: UpdateDailyLogInput) {
    const supabase = await createClient();

    // 1. daily_rate_logs 업데이트
    const { error: logError } = await supabase
        .from('daily_rate_logs')
        .update(log as any)
        .eq('id', id);

    if (logError) {
        console.error('Failed to update daily log:', logError);
        throw new Error('현장 기록 수정 중 오류가 발생했습니다.');
    }

    // 2. 기존 종속 데이터 삭제 (단순화를 위해 삭제 후 재삽입 전략 사용)
    await supabase.from('crew_payments').delete().eq('daily_rate_log_id', id);
    await supabase.from('site_expenses').delete().eq('daily_rate_log_id', id);

    // 3. 새 종속 데이터 삽입
    if (crew.length > 0) {
        const { error: crewError } = await supabase.from('crew_payments').insert(
            crew.map(c => ({ ...c, daily_rate_log_id: id })) as any
        );
        if (crewError) console.error('Failed to update crew payments:', crewError);
    }

    if (expenses.length > 0) {
        const { error: expenseError } = await supabase.from('site_expenses').insert(
            expenses.map(e => ({ ...e, daily_rate_log_id: id })) as any
        );
        if (expenseError) console.error('Failed to update site expenses:', expenseError);
    }

    return id;
}
