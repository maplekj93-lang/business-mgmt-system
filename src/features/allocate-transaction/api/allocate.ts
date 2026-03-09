'use server'

import { createClient } from '@/shared/api/supabase/server';
import { revalidatePath } from 'next/cache';

export interface AllocateResult {
    success: boolean;
    message?: string;
}

export async function allocateTransactionAction(
    transactionIds: string[],
    businessUnitId: string,
    projectId?: string | null
): Promise<AllocateResult> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, message: 'Unauthorized' };

    try {
        const { error } = await (supabase
            .from('transactions') as any)
            .update({
                allocation_status: 'business_allocated',
                business_unit_id: businessUnitId,
                project_id: projectId || null,
            })
            .in('id', transactionIds)
            .eq('user_id', user.id); // Security: Ensure ownership

        if (error) throw error;

        revalidatePath('/');
        revalidatePath('/transactions/history');

        return { success: true };

    } catch (e: any) {
        console.error('Allocate Transaction Error:', e);
        return { success: false, message: e.message };
    }
}
