'use server'

import { createClient } from '@/shared/api/supabase/server';


// [Type Definition] RPC가 반환하는 데이터 구조 (SQL 리턴값과 일치)
interface DashboardRpcResponse {
    total_income: number;
    total_expense: number;
    net_profit: number;
    trend: {
        year: number;
        month: number;
        income: number;
        expense: number;
        profit: number;
    }[];
    unit_breakdown: {
        unit_name: string;
        income: number;
        expense: number;
        net: number;
    }[];
}

// UI 컴포넌트가 사용할 데이터 구조 (CamelCase)
export interface DashboardStats {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    trend: DashboardRpcResponse['trend'];
    unitBreakdown: DashboardRpcResponse['unit_breakdown'];
}

export async function getMonthlyStats(params?: { mode?: 'personal' | 'total' | 'business' }): Promise<DashboardStats | null> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const mode = params?.mode || 'personal';

    // 1. RPC Call (Type Safe)
    const { data, error } = await supabase.rpc('get_dashboard_stats', {
        p_mode: mode
    });

    if (error) {
        console.error('getMonthlyStats Error detail:', error.message || error);
        return null;
    }

    // RPC returns an array (set-returning function), take the first row
    const result = data && Array.isArray(data) && data[0] ? data[0] : null;

    if (!result) {
        return { totalIncome: 0, totalExpense: 0, netProfit: 0, trend: [], unitBreakdown: [] };
    }

    return {
        totalIncome: Number(result.total_income),
        totalExpense: Number(result.total_expense),
        netProfit: Number(result.net_profit),
        trend: (result.trend as unknown as DashboardRpcResponse['trend']) || [],
        unitBreakdown: (result.unit_breakdown as unknown as DashboardRpcResponse['unit_breakdown']) || []
    };
}
