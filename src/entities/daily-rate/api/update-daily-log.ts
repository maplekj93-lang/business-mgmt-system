'use server'
import { revalidatePath } from 'next/cache';
import { createClient } from '@/shared/api/supabase/server';
import { CreateDailyLogInputSchema, type DailyRateLogInput } from '../model/schema';

export async function updateDailyLog(id: string, rawInput: DailyRateLogInput) {
    const supabase = await createClient();

    // 1. 입력값 검증
    const validation = CreateDailyLogInputSchema.safeParse(rawInput);
    if (!validation.success) {
        return { 
            success: false, 
            error: validation.error.issues.map(issue => issue.message).join(', ') 
        };
    }

    const { crew_payments = [], site_expenses = [], ...logData } = validation.data;

    try {
        // 2. daily_rate_logs 업데이트
        const { error: logError } = await supabase
            .from('daily_rate_logs')
            .update({
                ...logData,
                vat_type: logData.vat_type || 'none',
                payment_status: logData.payment_status || 'pending'
            })
            .eq('id', id);

        if (logError) throw logError;

        // 3. 기존 종속 데이터 삭제 (단순화를 위해 삭제 후 재삽입 전략 사용)
        await supabase.from('crew_payments').delete().eq('daily_rate_log_id', id);
        await supabase.from('site_expenses').delete().eq('daily_rate_log_id', id);

        // 4. 새 종속 데이터 삽입
        if (crew_payments.length > 0) {
            const { error: crewError } = await supabase.from('crew_payments').insert(
                crew_payments.map(c => ({
                    crew_name: c.crew_name,
                    role: c.role,
                    amount_gross: c.amount_gross,
                    withholding_rate: c.withholding_rate,
                    account_info: c.account_info,
                    vat_type: c.vat_type || 'none',
                    paid: c.paid,
                    paid_date: c.paid_date,
                    daily_rate_log_id: id
                }))
            );
            if (crewError) throw crewError;
        }

        if (site_expenses.length > 0) {
            const { error: expenseError } = await supabase.from('site_expenses').insert(
                site_expenses.map(e => ({
                    category: e.category,
                    amount: e.amount,
                    memo: e.memo,
                    receipt_url: e.receipt_url,
                    included_in_invoice: e.included_in_invoice,
                    daily_rate_log_id: id
                }))
            );
            if (expenseError) throw expenseError;
        }

        revalidatePath('/business/daily-rates');
        return { success: true, data: id };
    } catch (error: unknown) {
        console.error('Failed to update daily log:', error);
        return { success: false, error: '현장 기록 수정 중 오류가 발생했습니다.' };
    }
}
