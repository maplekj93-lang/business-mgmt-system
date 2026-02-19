'use server'

import { createClient } from '@/shared/api/supabase/server';
import { revalidatePath } from 'next/cache';

interface BulkUpdateResult {
    success: boolean;
    message?: string;
}

export async function bulkUpdateTransactions(
    transactionIds: string[],
    categoryId: number,
    createRule: boolean,
    ruleKeyword?: string,
    businessUnitId?: string // Optional business unit ID
): Promise<BulkUpdateResult> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    try {
        // 1. Update Transactions
        const updateData: any = {
            category_id: categoryId,
        };

        if (businessUnitId) {
            updateData.allocation_status = 'business_allocated';
            updateData.business_unit_id = businessUnitId;
        } else {
            updateData.allocation_status = 'personal';
        }

        const { error: txError } = await (supabase
            .from('transactions') as any)
            .update(updateData)
            .in('id', transactionIds);

        if (txError) throw txError;

        // 2. Create Rule (if requested)
        if (createRule && ruleKeyword) {
            // Check existence first or rely on UNIQUE constraint?
            // UPSERT strategy: On conflict, update category
            const { error: ruleError } = await (supabase
                .from('mdt_allocation_rules') as any)
                .upsert({
                    user_id: user.id,
                    keyword: ruleKeyword,
                    category_id: categoryId
                }, { onConflict: 'user_id, keyword' });

            if (ruleError) {
                console.warn('Failed to create rule:', ruleError);
                // Non-blocking error?
            } else {
                console.log(`[RuleEngine] Created rule for "${ruleKeyword}" -> Category ${categoryId}`);
            }
        }

        revalidatePath('/transactions/unclassified');
        revalidatePath('/transactions/history');

        return { success: true };

    } catch (e: any) {
        console.error('bulkUpdateTransactions Error:', e);
        return { success: false, message: e.message };
    }
}
