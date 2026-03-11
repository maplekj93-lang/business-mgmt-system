'use server'

import { createClient } from '@/shared/api/supabase/server';

export interface BusinessSummary {
    unpaid_crew_amount: number;
    pending_logs_count: number;
    active_projects_count: number;
    overdue_tasks_count: number;
}

export async function getBusinessSummary(): Promise<BusinessSummary> {
    const supabase = await createClient();

    // 1. 미지급 크루 인건비 합계
    const { data: unpaidCrew } = await supabase
        .from('crew_payments')
        .select('amount_gross')
        .eq('paid', false);

    const unpaidCrewAmount = unpaidCrew?.reduce((sum, item) => sum + item.amount_gross, 0) || 0;

    // 2. 미결제 현장 기록 수
    const { count: pendingLogs } = await supabase
        .from('daily_rate_logs')
        .select('*', { count: 'exact', head: true })
        .eq('payment_status', 'pending');

    // 3. 활성 프로젝트 수
    const { count: activeProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

    return {
        unpaid_crew_amount: unpaidCrewAmount,
        pending_logs_count: pendingLogs || 0,
        active_projects_count: activeProjects || 0,
        overdue_tasks_count: 0 // 태스크 관리가 아직 없으므로 0
    };
}
