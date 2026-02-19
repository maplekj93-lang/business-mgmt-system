'use server'

import { createClient } from '@/shared/api/supabase/server'

export async function resetTransactionsAction() {
    const supabase = await createClient()

    const { error } = await supabase
        .from('transactions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (error) {
        console.error("Reset Error:", error)
        return { success: false, error: error.message }
    }
    return { success: true }
}
