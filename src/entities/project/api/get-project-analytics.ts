'use server'

import { createClient } from '@/shared/api/supabase/server';
import { OwnerType } from '@/shared/constants/business';

export interface ProjectProfitabilityData {
    id: string;
    name: string;
    revenue: number;
    labor_cost: number;
    expenses: number;
    net_profit: number;
    profit_margin: number;
    owner_id: string;
    status: 'active' | 'completed' | 'on_hold';
}

export interface CategoryDistribution {
    name: string;
    value: number;
    color?: string;
    icon?: string;
}

export async function getProjectAnalytics(params: {
    ownerId?: OwnerType | 'all';
    month?: number;
    year?: number;
    mode?: 'total' | 'business' | 'personal';
}) {
    const supabase = await createClient();
    const ownerId = params.ownerId === 'all' ? null : params.ownerId;
    const month = params.month || new Date().getMonth() + 1;
    const year = params.year || new Date().getFullYear();
    const mode = params.mode || 'business';

    try {
        // 1. 프로젝트 수익성 데이터 (RPC)
        // Note: RPC name might not be in the generated types yet, use any cast
        const { data: profitability, error: profError } = await (supabase.rpc as any)('get_project_profitability', {
            p_owner_id: ownerId
        });

        if (profError) throw profError;

        // 2. 카테고리 지출 분포 데이터 (RPC)
        const { data: analytics, error: analyticsError } = await (supabase.rpc as any)('get_advanced_analytics', {
            p_mode: mode,
            p_month: month,
            p_year: year,
            p_owner_id: ownerId
        });

        if (analyticsError) throw analyticsError;

        const result = analytics && Array.isArray(analytics) && analytics[0] ? analytics[0] : { category_distribution: [] };

        return {
            success: true,
            data: {
                profitability: (profitability as any[] || []).map((p: any) => ({
                    id: p.project_id,
                    name: p.project_name,
                    revenue: Number(p.revenue),
                    labor_cost: Number(p.labor_cost),
                    expenses: Number(p.expenses),
                    net_profit: Number(p.net_profit),
                    profit_margin: Number(p.profit_margin),
                    owner_id: p.owner_id as string,
                    status: (p.status || 'active') as any
                })),
                categoryDistribution: (result.category_distribution as any[] || []).map((c: any) => ({
                    name: c.name,
                    value: Number(c.value),
                    color: c.color,
                    icon: c.icon
                }))
            }
        };

    } catch (error: any) {
        console.error('Failed to get project analytics:', error.message || error);
        return {
            success: false,
            error: '분석 데이터를 가져오지 못했습니다.',
            data: {
                profitability: [],
                categoryDistribution: []
            }
        };
    }
}
