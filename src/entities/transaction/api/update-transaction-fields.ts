'use server'

import { createClient } from '@/shared/api/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateTransactionFields(
    id: string,
    fields: { description?: string; receipt_memo?: string }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('transactions')
        .update(fields)
        .eq('id', id);

    if (error) throw error;

    revalidatePath('/transactions/unclassified');
    revalidatePath('/transactions/history');
    return { success: true };
}
