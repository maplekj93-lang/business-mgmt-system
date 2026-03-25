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
        const updateData: {
          category_id: number;
          allocation_status: 'personal' | 'business_allocated';
          business_unit_id?: string | null;
          manual_override: boolean;
        } = {
            category_id: categoryId,
            allocation_status: businessUnitId ? 'business_allocated' : 'personal',
            manual_override: true
        };

        if (businessUnitId) {
            updateData.business_unit_id = businessUnitId;
        }

        const { data: updatedRows, error: txError } = await supabase
            .from('transactions')
            .update(updateData as any) // Partial update sometimes needs as any if optional fields conflict
            .in('id', transactionIds)
            .select('id');

        if (txError) throw txError;
        if (!updatedRows || updatedRows.length === 0) {
            return { success: false, message: 'No transactions were updated. (Check permissions or IDs)' };
        }

        // 2. Create Rule (if requested)
        if (createRule && ruleKeyword) {
            const { error: ruleError } = await supabase
                .from('mdt_allocation_rules')
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
