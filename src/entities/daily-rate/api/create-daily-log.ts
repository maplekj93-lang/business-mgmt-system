'use server'
import { createClient } from '@/shared/api/supabase/server';
import type { DailyRateLog, CrewPayment, SiteExpense } from '../model/types';

interface CreateDailyLogInput {
    log: Omit<DailyRateLog, 'id' | 'amount_net' | 'created_at' | 'client' | 'crew_payments' | 'site_expenses'>;
    crew?: Omit<CrewPayment, 'id' | 'daily_rate_log_id' | 'amount_net'>[];
    expenses?: Omit<SiteExpense, 'id' | 'daily_rate_log_id'>[];
}

export async function createDailyLog({ log, crew = [], expenses = [] }: CreateDailyLogInput) {
    const supabase = await createClient();

    // 1. daily_rate_logs 삽입
    const { data: logData, error: logError } = await supabase
        .from('daily_rate_logs')
        .insert(log as any)
        .select('id')
        .single();

    if (logError) {
        console.error('Failed to create daily log:', logError);
        throw new Error('현장 기록 생성 중 오류가 발생했습니다.');
    }

    const logId = logData.id;

    // 2. crew_payments 일괄 삽입
    if (crew.length > 0) {
        const { error: crewError } = await supabase.from('crew_payments').insert(
            crew.map(c => ({ ...c, daily_rate_log_id: logId })) as any
        );
        if (crewError) console.error('Failed to insert crew payments:', crewError);
    }

    // 3. site_expenses 일괄 삽입
    if (expenses.length > 0) {
        const { error: expenseError } = await supabase.from('site_expenses').insert(
            expenses.map(e => ({ ...e, daily_rate_log_id: logId })) as any
        );
        if (expenseError) console.error('Failed to insert site expenses:', expenseError);
    }

    return logId;
}
