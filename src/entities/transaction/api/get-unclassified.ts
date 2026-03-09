'use server'

import { createClient } from '@/shared/api/supabase/server';

export interface UnclassifiedGroup {
    rawName: string;
    amount: number; // [NEW] Added for granular grouping
    ownerType: string; // [NEW] Added owner type from RPC
    count: number;
    transactionIds: string[];
    sampleDate: string;
    totalAmount: number;
    type: 'income' | 'expense';
}

interface UnclassifiedRpcResponse {
    raw_name: string;
    amount: number; // [NEW]
    owner_type: string;
    count: number;
    transaction_ids: string[];
    sample_date: string;
    total_amount: number;
    type: 'income' | 'expense';
}

export async function getUnclassifiedTransactions(): Promise<UnclassifiedGroup[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Constitution Art 3. Database-First
    // Grouping performed in DB Layer via RPC
    const { data, error } = await (supabase.rpc as any)('get_unclassified_stats');

    if (error) {
        console.error('getUnclassifiedTransactions Error:', error);
        return []; // Return empty instead of throwing to prevent page crash
    }

    if (!data) return [];

    // Map RPC result to UI Model
    return (data as UnclassifiedRpcResponse[]).map((row) => ({
        rawName: row.raw_name,
        amount: Number(row.amount), // [NEW]
        ownerType: row.owner_type,
        count: Number(row.count),
        transactionIds: row.transaction_ids, // UUID Array
        sampleDate: row.sample_date ? new Date(row.sample_date).toISOString().split('T')[0] : '',
        totalAmount: Number(row.total_amount),
        type: row.type
    }));
}
