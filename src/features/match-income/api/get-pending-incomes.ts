'use server'

import { createClient } from '@/shared/api/supabase/server';

export interface PendingIncome {
    id: string;
    type: 'project_income' | 'daily_rate_log';
    title: string;
    amount: number;
    date: string;
    client_name?: string;
}

/**
 * 미정산/미매칭 수입 내역을 가져옵니다.
 */
export async function getPendingIncomes() {
    const supabase = await createClient();
    
    try {
        // 1. 프로젝트 수입 중 미결제(입금대기) 또는 미매칭 내역
        const { data: projectIncomes, error: pError } = await supabase
            .from('project_incomes')
            .select('id, title, amount, created_at, status, projects(name, clients(name))')
            .or('status.eq.입금대기,status.eq.pending')
            .limit(10);

        if (pError) throw pError;

        // 2. 일당 기록 중 미결제 내역
        const { data: dailyLogs, error: dError } = await supabase
            .from('daily_rate_logs')
            .select('id, site_name, amount_gross, work_date, payment_status')
            .or('payment_status.eq.입금대기,payment_status.eq.pending')
            .limit(10);

        if (dError) throw dError;

        const combined: PendingIncome[] = [
            ...(projectIncomes || []).map(p => ({
                id: p.id,
                type: 'project_income' as const,
                title: p.title || (p.projects as any)?.name || '프로젝트 수입',
                amount: p.amount,
                date: p.created_at || new Date().toISOString(),
                client_name: (p.projects as any)?.clients?.name
            })),
            ...(dailyLogs || []).map(d => ({
                id: d.id,
                type: 'daily_rate_log' as const,
                title: d.site_name,
                amount: d.amount_gross,
                date: d.work_date,
            }))
        ];

        // 날짜순 정렬
        return { 
            success: true, 
            data: combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) 
        };
    } catch (e: any) {
        console.error('Get Pending Incomes Error:', e);
        return { success: false, message: e.message, data: [] };
    }
}
