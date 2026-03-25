'use server'
import { revalidatePath } from 'next/cache';
import { createClient } from '@/shared/api/supabase/server';
import { CreateDailyLogInputSchema, type DailyRateLogInput } from '../model/schema';

export async function createDailyLog(rawInput: DailyRateLogInput) {
    const supabase = await createClient();
    
    // 1. 입력값 검증 (Zod)
    const validation = CreateDailyLogInputSchema.safeParse(rawInput);
    if (!validation.success) {
        return { 
            success: false, 
            error: validation.error.issues.map(issue => issue.message).join(', ') 
        };
    }
    
    const { crew_payments = [], site_expenses = [], ...logData } = validation.data;

    // 2. 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: '인증되지 않은 사용자입니다.' };

    try {
        // 3. daily_rate_logs 삽입
        const { data: createdLog, error: logError } = await supabase
            .from('daily_rate_logs')
            .insert({
                ...logData,
                user_id: user.id,
                vat_type: logData.vat_type || 'none',
                payment_status: logData.payment_status || 'pending'
            })
            .select('id')
            .single();

        if (logError) throw logError;

        const logId = createdLog.id;

        // 4. crew_payments 일괄 삽입
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
                    daily_rate_log_id: logId
                }))
            );
            if (crewError) throw crewError;
        }

        // 5. site_expenses 일괄 삽입
        if (site_expenses.length > 0) {
            const { error: expenseError } = await supabase.from('site_expenses').insert(
                site_expenses.map(e => ({
                    category: e.category,
                    amount: e.amount,
                    memo: e.memo,
                    receipt_url: e.receipt_url,
                    included_in_invoice: e.included_in_invoice,
                    daily_rate_log_id: logId
                }))
            );
            if (expenseError) throw expenseError;
        }

        revalidatePath('/business/daily-rates');
        return { success: true, data: logId };
    } catch (error: unknown) {
        console.error('Failed to create daily log:', error);
        return { success: false, error: '현장 기록 생성 중 오류가 발생했습니다.' };
    }
}
