'use server'

import { createClient } from '@/shared/api/supabase/server';
import { revalidatePath } from 'next/cache';

interface UpdateTransactionParams {
    transactionId: string;
    categoryId?: number | null;
    assetId?: string | null;
    ownerType?: string | null; // [NEW] Independent owner assignment
    description?: string;
    businessUnitId?: string | null;
    applyToSimilarUnclassified?: boolean;
}

export async function updateTransactionAction({
    transactionId,
    categoryId,
    assetId,
    ownerType,
    description,
    businessUnitId,
    applyToSimilarUnclassified = false
}: UpdateTransactionParams) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    try {
        const updateData: any = {};

        if (categoryId !== undefined) {
            updateData.category_id = categoryId;
            updateData.manual_override = true;
        }
        if (description !== undefined) updateData.description = description;
        if (businessUnitId !== undefined) {
            updateData.business_unit_id = businessUnitId;
            updateData.allocation_status = businessUnitId ? 'business_allocated' : 'personal';
            updateData.manual_override = true;
        }

        if (assetId !== undefined) {
            updateData.asset_id = assetId;
            if (assetId && ownerType === undefined) {
                // If asset is updated but owner isn't explicitly set, fallback to asset's owner
                const { data: assetData } = await (supabase.from('assets') as any)
                    .select('owner_type')
                    .eq('id', assetId)
                    .single();

                if (assetData) {
                    updateData.owner_type = assetData.owner_type;
                }
            } else if (assetId === null && ownerType === undefined) {
                updateData.owner_type = 'other';
            }
        }

        if (ownerType !== undefined) {
            updateData.owner_type = ownerType;
        }

        if (applyToSimilarUnclassified && assetId !== undefined) {
            // First fetch the target transaction
            const { data: targetTx } = await (supabase.from('transactions') as any)
                .select('*')
                .eq('id', transactionId)
                .single();

            if (targetTx) {
                const desc = targetTx.description || targetTx.source_raw_data?.original_category || '';
                if (desc) {
                    const { error: bulkError } = await (supabase.from('transactions') as any)
                        .update(updateData)
                        .eq('user_id', user.id)
                        .is('asset_id', null)
                        .or(`description.eq."${desc}",source_raw_data->>original_category.eq."${desc}"`);

                    if (bulkError) console.error('Bulk update error:', bulkError);
                }
            }
        }

        // Always update the target transaction anyway
        const { error } = await (supabase
            .from('transactions') as any)
            .update(updateData)
            .eq('id', transactionId)
            .eq('user_id', user.id);

        if (error) throw error;

        revalidatePath('/transactions/history');
        revalidatePath('/transactions/unclassified');

        return { success: true };
    } catch (e: any) {
        console.error('updateTransactionAction Error:', e);
        return { success: false, message: e.message };
    }
}
