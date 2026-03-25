'use server'

import { createClient } from '@/shared/api/supabase/server'

export async function resetTransactionsAction() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { success: false, error: 'Unauthorized' }

    // RLS will handle user isolation, but we specify user_id to be safe
    const { error: txError } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id)

    const { error: batchError } = await supabase
        .from('import_batches')
        .delete()
        .eq('user_id', user.id)

    if (txError || batchError) {
        console.error("Reset Error:", txError || batchError)
        return { success: false, error: (txError || batchError)?.message }
    }
    return { success: true }
}
