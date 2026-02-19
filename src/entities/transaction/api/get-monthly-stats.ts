'use server'

import { createClient } from '@/shared/api/supabase/server';
import { cookies } from 'next/headers';

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

export async function getMonthlyStats(): Promise<DashboardStats | null> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Check Context Mode
    const cookieStore = await cookies();
    const appMode = (cookieStore.get('app-mode')?.value as 'personal' | 'total' | 'business') || 'personal';

    // 1. RPC Call with Generic Type (Type Safety)
    const { data, error } = await supabase
        .rpc<any>('get_dashboard_stats', {
            p_mode: appMode
        } as any);

    if (error) {
        console.error('getMonthlyStats Error detail:', error.message || error);
        return null;
    }

    // RPC returns an array (set-returning function), take the first row
    const result = data && Array.isArray(data) && data[0] ? (data[0] as DashboardRpcResponse) : null;

    if (!result) {
        return { totalIncome: 0, totalExpense: 0, netProfit: 0, trend: [], unitBreakdown: [] };
    }

    return {
        totalIncome: Number(result.total_income),
        totalExpense: Number(result.total_expense),
        netProfit: Number(result.net_profit),
        trend: result.trend || [],
        unitBreakdown: result.unit_breakdown || []
    };
}
