'use server'

import { createClient } from '@/shared/api/supabase/server';
import { OwnerType } from '@/shared/constants/business';

export interface BusinessSummary {
    unpaid_crew_amount: number;
    pending_logs_count: number;
    active_projects_count: number;
    overdue_tasks_count: number;
}

export async function getBusinessSummary(ownerId?: OwnerType | 'all') {
    const supabase = await createClient();
    const isAll = !ownerId || ownerId === 'all';

    try {
        // 1. 미지급 크루 인건비 합계
        // note: daily_rate_logs 테이블에 owner_id가 추가되었다고 가정 (마이그레이션 필요)
        let crewQuery = supabase
            .from('crew_payments')
            .select('amount_gross, daily_rate_logs!inner(owner_id)')
            .eq('paid', false);
        
        if (!isAll) {
            crewQuery = crewQuery.eq('daily_rate_logs.owner_id', ownerId);
        }

        const { data: unpaidCrew, error: crewError } = await crewQuery;

        if (crewError) throw crewError;

        const unpaidCrewAmount = unpaidCrew?.reduce((sum, item) => sum + item.amount_gross, 0) || 0;

        // 2. 미결제 현장 기록 수
        let logQuery = supabase
            .from('daily_rate_logs')
            .select('*', { count: 'exact', head: true })
            .eq('payment_status', 'pending');
        
        if (!isAll) {
            logQuery = logQuery.eq('owner_id', ownerId);
        }

        const { count: pendingLogs, error: logError } = await logQuery;

        if (logError) throw logError;

        // 3. 활성 프로젝트 수
        let projectQuery = supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');
        
        if (!isAll) {
            projectQuery = projectQuery.eq('business_owner', ownerId);
        }

        const { count: activeProjects, error: projectError } = await projectQuery;

        if (projectError) throw projectError;

        return {
            success: true,
            data: {
                unpaid_crew_amount: unpaidCrewAmount,
                pending_logs_count: pendingLogs || 0,
                active_projects_count: activeProjects || 0,
                overdue_tasks_count: 0 // 태스크 관리가 아직 없으므로 0
            }
        };
    } catch (error: unknown) {
        console.error('Failed to get business summary:', error);
        return { 
            success: false, 
            error: '비즈니스 요약을 가져오지 못했습니다.',
            data: {
                unpaid_crew_amount: 0,
                pending_logs_count: 0,
                active_projects_count: 0,
                overdue_tasks_count: 0
            }
        };
    }
}
