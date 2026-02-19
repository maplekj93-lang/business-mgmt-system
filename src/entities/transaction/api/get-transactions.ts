'use server'

import { createClient } from '@/shared/api/supabase/server';
import { Transaction } from '../model/schema';
import { Json } from '@/shared/api/supabase/database.types';

export type GetTransactionsParams = {
    page?: number;
    limit?: number;
    year?: number;
    month?: number;
    mode?: 'personal' | 'business' | 'total'; // [NEW] Explicit mode parameter
}

interface FilteredTransactionRpcResponse {
    id: string;
    date: string;
    amount: number;
    description: string;
    category_id: number;
    allocation_status: 'personal' | 'business_unallocated' | 'business_allocated';
    business_unit_id: string;
    source_raw_data: Json;
    category_name: string;
    category_type: string;
    category_icon: string;
    category_color: string;
    parent_category_name: string;
}

export async function getTransactions(params: GetTransactionsParams = {}): Promise<Transaction[]> {
    const supabase = await createClient();

    // 1. Auth Check (RLS Pre-check)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return [];
    }

    // Determine Mode (Default to personal if not provided)
    const appMode = params.mode || 'personal';

    // 2. Query Builder (Constitution Art 3: Database-First)
    // We use a dedicated RPC to handle complex business/personal logic correctly.
    const { data: rawTxs, error: txError } = await supabase
        .rpc('get_filtered_transactions', {
            p_mode: appMode,
            p_year: params.year || undefined,
            p_month: params.month || undefined,
            p_page: params.page || 1,
            p_limit: params.limit || 50
        } as any);

    if (txError) {
        console.error('getTransactions RPC Error:', txError);
        return [];
    }

    // 3. Map flattened RPC result to nested Transaction entity structure
    const normalizedTxs = (rawTxs as FilteredTransactionRpcResponse[])?.map((row) => ({
        id: row.id,
        date: row.date,
        amount: Number(row.amount),
        description: row.description,
        category_id: row.category_id,
        allocation_status: row.allocation_status,
        business_unit_id: row.business_unit_id,
        source_raw_data: row.source_raw_data,
        category: row.category_id ? {
            id: row.category_id,
            name: row.category_name,
            type: row.category_type as 'income' | 'expense' | 'transfer',
            ui_config: {
                icon: row.category_icon,
                color: row.category_color
            },
            parent: row.parent_category_name ? {
                id: 0, // Parent ID not returned by RPC, but name is enough for UI
                name: row.parent_category_name
            } : null
        } : null
    }));

    return normalizedTxs as Transaction[];
}
