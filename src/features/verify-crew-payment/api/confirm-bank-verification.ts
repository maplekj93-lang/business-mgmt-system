'use server'

import { createClient } from '@/shared/api/supabase/server'
import { CrewPaymentMatch } from './match-crew-payments'

export async function confirmBankVerification(matches: CrewPaymentMatch[]): Promise<{ success: boolean; updated_count: number }> {
    const supabase = await createClient()
    
    // Only confirm "matched" items (and maybe "candidate" if the user manually approved them? 
    // Usually the UI will change candidate to matched if approved, so we just trust the array passed in where status='matched')
    const confirmedMatches = matches.filter(m => m.match_status === 'matched' && m.payment_id)
    
    if (confirmedMatches.length === 0) {
        return { success: true, updated_count: 0 }
    }

    let updatedCount = 0

    // Since Supabase RPC for bulk update isn't available by default, loop through updates
    // For small sets, looping is fine.
    for (const match of confirmedMatches) {
        const { error } = await supabase.from('crew_payments')
            .update({
                bank_verified: true,
                verified_at: new Date().toISOString()
            })
            .eq('id', match.payment_id!)

        if (!error) {
            updatedCount++
        } else {
            console.error(`Failed to verify payment ${match.payment_id}:`, error)
        }
    }

    return { success: true, updated_count: updatedCount }
}
