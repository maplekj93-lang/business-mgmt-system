'use server'

import { createClient } from '@/shared/api/supabase/server';
import { revalidatePath } from 'next/cache';

export interface MatchIncomeV2Params {
    incomeId: string;
    incomeType: 'project_income' | 'daily_rate_log';
    transactionIds: string[];
    amountsAllocated: number[];
    createRule?: boolean;
    ruleSenderName?: string;
    ruleKeyword?: string;
}

/**
 * 입금 매칭 V2 서버 액션
 * 분할 입금 대응 및 자동 학습 규칙 생성을 처리합니다.
 */
export async function matchIncomeActionV2(params: MatchIncomeV2Params) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, message: '인증되지 않은 사용자입니다.' };

    try {
        const { error } = await (supabase.rpc as any)('confirm_income_matching_v2', {
            p_income_id: params.incomeId,
            p_income_type: params.incomeType,
            p_transaction_ids: params.transactionIds,
            p_amounts_allocated: params.amountsAllocated,
            p_create_rule: params.createRule ?? true,
            p_rule_sender_name: params.ruleSenderName,
            p_rule_keyword: params.ruleKeyword
        });

        if (error) throw error;

        // 관련 페이지 캐시 갱신
        revalidatePath('/dashboard');
        revalidatePath('/business/projects');
        revalidatePath('/business/daily-rates');

        return { success: true };
    } catch (e: any) {
        console.error('Match Income V2 Error:', e);
        return { success: false, message: e.message || '매칭 처리 중 오류가 발생했습니다.' };
    }
}
