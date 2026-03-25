'use server'

import { createClient } from '@/shared/api/supabase/server';
// Use any for simplicity in this server action, or import from ledger-import if needed

export async function getPendingTransactions() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data, error } = await supabase
        .from('transactions')
        .select(`
            *,
            category:mdt_categories(id, name, type)
        `)
        .eq('user_id', user.id)
        .eq('allocation_status', 'pending')
        .order('date', { ascending: false });

    if (error) {
        console.error('getPendingTransactions Error:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data: data as any[] };
}
