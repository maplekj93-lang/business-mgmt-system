'use server'

import { createClient } from '@/shared/api/supabase/server';
import { revalidatePath } from 'next/cache';

export async function matchIncomeAction(
    projectIncomeId: string,
    transactionId: string | null
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, message: 'Unauthorized' };

    try {
        // 1. Update Project Income
        const { error: incomeError } = await supabase
            .from('project_incomes' as any)
            .update({ matched_transaction_id: transactionId })
            .eq('id', projectIncomeId);

        if (incomeError) throw incomeError;

        // 2. If matching a transaction, mark it as allocated to this project
        if (transactionId) {
            const { error: txError } = await (supabase
                .from('transactions') as any)
                .update({
                    allocation_status: 'business_allocated',
                    project_id: (await (supabase.from('project_incomes' as any).select('project_id').eq('id', projectIncomeId).single() as any)).data?.project_id
                })
                .eq('id', transactionId);

            if (txError) throw txError;
        }

        revalidatePath('/business/projects');
        return { success: true };

    } catch (e: any) {
        console.error('Match Income Error:', e);
        return { success: false, message: e.message };
    }
}
