'use server'

import { createClient } from '@/shared/api/supabase/server';
import { revalidatePath } from 'next/cache';

export async function confirmTransaction(transactionId: string, allocationStatus: string, categoryId?: number | null) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { error } = await supabase
        .from('transactions')
        .update({
            allocation_status: allocationStatus,
            category_id: categoryId,
            // [NEW] Mark as confirmed in metadata
            metadata: { confirmed_at: new Date().toISOString(), ai_confirmed: true }
        })
        .eq('id', transactionId)
        .eq('user_id', user.id);

    if (error) {
        console.error('confirmTransaction Error:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
}
