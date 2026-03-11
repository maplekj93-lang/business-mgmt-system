'use server'

import { createClient } from '@/shared/api/supabase/server';
import { revalidatePath } from 'next/cache';
import { addVatFromIncome } from '@/entities/vat/api/vat-api';

export async function matchIncomeAction(
    projectIncomeId: string,
    transactionId: string | null
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, message: 'Unauthorized' };

    try {
        // 0. Get Project Income details (amount for VAT calculation)
        const { data: projectIncome, error: incomeDetailsError } = await supabase
            .from('project_incomes')
            .select(`
                amount, 
                project_id,
                projects ( id, client_id, invoice_sent_date )
            `)
            .eq('id', projectIncomeId)
            .single();

        if (incomeDetailsError) throw incomeDetailsError;

        // 1. Update Project Income
        const { error: incomeError } = await supabase
            .from('project_incomes')
            .update({ matched_transaction_id: transactionId })
            .eq('id', projectIncomeId);

        if (incomeError) throw incomeError;

        // 2. If matching a transaction, mark it as allocated to this project
        if (transactionId) {
            // Fetch transaction date to use as actual payment date
            const { data: txData } = await supabase.from('transactions').select('date').eq('id', transactionId).single();
            const txDate = txData?.date || new Date().toISOString().split('T')[0];

            const { error: txError } = await supabase
                .from('transactions')
                .update({
                    allocation_status: 'business_allocated',
                    project_id: projectIncome?.project_id
                })
                .eq('id', transactionId);

            if (txError) throw txError;

            // 2-1. Record actual payment date on the Project
            if (projectIncome?.project_id) {
                await supabase
                    .from('projects')
                    .update({ actual_payment_date: txDate })
                    .eq('id', projectIncome.project_id);

                // 2-2. Recalculate average lead time for the client
                const clientId = (projectIncome.projects as any)?.client_id;
                const invoiceDateStr = (projectIncome.projects as any)?.invoice_sent_date;
                
                if (clientId && invoiceDateStr) {
                    // We need to trigger an RPC or just update via fetching all past projects
                    // For simplicity, we can fetch all completed projects for this client
                    const { data: clientProjects } = await supabase
                        .from('projects')
                        .select('invoice_sent_date, actual_payment_date')
                        .eq('client_id', clientId)
                        .not('invoice_sent_date', 'is', null)
                        .not('actual_payment_date', 'is', null);
                        
                    if (clientProjects && clientProjects.length > 0) {
                        let totalDays = 0;
                        let validCount = 0;
                        clientProjects.forEach(p => {
                            if (p.invoice_sent_date && p.actual_payment_date) {
                                const iDate = new Date(p.invoice_sent_date);
                                const aDate = new Date(p.actual_payment_date);
                                const diffTime = Math.abs(aDate.getTime() - iDate.getTime());
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                totalDays += diffDays;
                                validCount++;
                            }
                        });
                        if (validCount > 0) {
                            const avgDays = Math.round(totalDays / validCount);
                            await supabase.from('clients').update({ avg_payment_lead_days: avgDays }).eq('id', clientId);
                        }
                    }
                }
            }
        }

        // 3. Auto-calculate and add VAT (10%) for this income
        if (projectIncome?.amount) {
            await addVatFromIncome(projectIncome.amount);
        }

        revalidatePath('/business/projects');
        return { success: true };

    } catch (e: any) {
        console.error('Match Income Error:', e);
        return { success: false, message: e.message };
    }
}
