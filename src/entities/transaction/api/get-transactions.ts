'use server'

import { createClient } from '@/shared/api/supabase/server';
import { Transaction } from '../model/schema';
import { Json } from '@/shared/types/database.types';

export type GetTransactionsParams = {
    page?: number;
    limit?: number;
    year?: number;
    month?: number;
    mode?: 'personal' | 'business' | 'total'; // [NEW] Explicit mode parameter
    dateFilter?: 'today' | 'this_week' | 'scheduled' | null;
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
    asset_id?: string;
    asset_name?: string;
    asset_type?: string;
    tx_owner_type?: string; // [NEW] Owner on the transaction itself
    owner_type?: string;    // Owner on the asset (retained for backward compatibility if needed)
    project_id?: string;
    project_name?: string;
    receipt_memo?: string;
    is_reimbursable?: boolean;
    excluded_from_personal?: boolean;
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

    // 2. Query (Type Safe)
    const { data: rawTxs, error: txError } = await supabase.rpc('get_filtered_transactions', {
        p_mode: appMode,
        p_year: params.year ?? null,
        p_month: params.month ?? null,
        p_page: params.page ?? 1,
        p_limit: params.limit ?? 50,
        p_date_filter: params.dateFilter ?? null
    } as any); // RPC overloads might still need partial as any if types disagree on nulls

    if (txError) {
        console.error('getTransactions RPC Error:', txError);
        return [];
    }

    // 3. Map flattened RPC result to nested Transaction entity structure
    const normalizedTxs = (rawTxs as FilteredTransactionRpcResponse[])?.map((row) => ({
        id: row.id,
        user_id: user.id,
        date: row.date,
        amount: Number(row.amount),
        original_currency: 'KRW',
        description: row.description,
        category_id: row.category_id,
        allocation_status: row.allocation_status,
        business_unit_id: row.business_unit_id,
        source_raw_data: row.source_raw_data,
        owner_type: row.tx_owner_type || null, // [NEW] explicit mapping from RPC
        asset_id: row.asset_id || null, // [NEW]
        asset: row.asset_id ? {          // [NEW]
            id: row.asset_id,
            name: row.asset_name || 'Unknown Asset',
            asset_type: row.asset_type || 'Unknown Type',
            owner_type: row.owner_type || 'Unknown Owner'
        } : null,
        project_id: row.project_id || null, // [NEW]
        receipt_memo: row.receipt_memo || null, // [NEW]
        is_reimbursable: row.is_reimbursable || false, // [NEW]
        excluded_from_personal: row.excluded_from_personal || false,
        is_scheduled: (row as any).is_scheduled || false,
        source: 'MANUAL', // [NEW] Default for display
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
