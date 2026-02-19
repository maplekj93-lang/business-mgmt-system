'use server'

import { createClient } from '@/shared/api/supabase/server'
import { ValidatedTransaction } from '../model/types'

type ImportResult = {
    success: boolean
    count: number
    errors: string[]
}

export async function uploadBatchAction(transactions: ValidatedTransaction[]): Promise<ImportResult> {
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, count: 0, errors: ['Unauthorized: Please log in.'] }
    }

    try {
        // 2. Fetch Categories for Mapping
        // We need to map "Main > Sub" or "Main" to category_id
        const { data: categories } = await supabase
            .from('mdt_categories')
            .select('id, name, parent_id')
            .returns<any[]>() // Explicit cast

        // 3. Transform Data
        console.log(`[UploadBatch] Processing ${transactions.length} transactions for user ${user.id}`);

        // Fetch Rules
        const { data: rules } = await supabase
            .from('mdt_allocation_rules')
            .select('keyword, category_id')
            .eq('user_id', user.id)
            .returns<any[]>(); // Explicit cast to avoid 'never'

        // Helper to normalize strings (remove all spaces) for loose matching
        const normalize = (s: string) => s.replace(/\s+/g, '');

        const ruleMap = new Map<string, number>();
        rules?.forEach(r => ruleMap.set(normalize(r.keyword), r.category_id));

        const categoryMap = new Map<string, number>(); // Strict Name -> ID
        const normalizedCatMap = new Map<string, number>(); // Normalized Name -> ID

        if (categories) {
            categories.forEach(c => {
                categoryMap.set(c.name, c.id);
                normalizedCatMap.set(normalize(c.name), c.id);
            });
        }

        // --- PARTIAL CANCEL PERSISTENCE (Refund Auto-Categorization) ---
        // 1. Identify potential refunds (Income > 0)
        const refundCandidates = transactions.filter(t => t.amount > 0 && t.description);
        const refundMap = new Map<string, number>();

        if (refundCandidates.length > 0) {
            // 2. Extract unique descriptions
            const descriptions = Array.from(new Set(refundCandidates.map(t => t.description)));

            // 3. Query DB for matching EXPENSES with these descriptions
            // We want to find: Expense with same Merchant and (ideally) matching amount magnitude
            const { data: history } = await supabase
                .from('transactions')
                .select('description, amount, category_id')
                .eq('user_id', user.id)
                .in('description', descriptions)
                .lt('amount', 0) // Look for expenses
                .not('category_id', 'is', null)
                .order('date', { ascending: false }) // Prefer recent
                .limit(500) // Guard against too much data
                .returns<any[]>(); // Explicit cast

            if (history) {
                history.forEach(h => {
                    // Key: "Merchant:Abs(Amount)"
                    // If we find an expense of -10000 for "Starbucks", and we have a refund of +10000 for "Starbucks"
                    const key = `${normalize(h.description)}:${Math.abs(h.amount)}`;
                    if (!refundMap.has(key)) {
                        refundMap.set(key, h.category_id!);
                    }

                    // Also store a generic fallback by Merchant only?
                    // Maybe riskier, but useful if amounts differ slightly (partial cancel).
                    // Let's stick to strict Amount match for safety first.
                });
            }
        }

        const payload = transactions.map(tx => {
            let categoryId: number | null = null;
            let rawForRule = tx.categoryRaw ? normalize(tx.categoryRaw) : '';

            // 1. Try Category Matching (Main > Sub)
            if (tx.categoryRaw) {
                // Split by '>' and normalize each part
                const parts = tx.categoryRaw.split('>').map(s => s.trim());
                const mainName = normalize(parts[0]);
                const subName = parts.length > 1 ? normalize(parts[parts.length - 1]) : null;

                if (normalizedCatMap.size > 0) {
                    // Try exact match on Sub Name (Highest Specificity)
                    if (subName && normalizedCatMap.has(subName)) categoryId = normalizedCatMap.get(subName)!;
                    // Try exact match on Main Name
                    else if (normalizedCatMap.has(mainName)) categoryId = normalizedCatMap.get(mainName)!;
                    // Try exact match on full string (normalized)
                    else if (normalizedCatMap.has(rawForRule)) categoryId = normalizedCatMap.get(rawForRule)!;
                }
            }

            // 2. Try Rule Engine (Keyword Match)
            if (!categoryId && ruleMap.size > 0) {
                // Check if specific raw category has a rule
                if (ruleMap.has(rawForRule)) {
                    categoryId = ruleMap.get(rawForRule)!;
                }
            }

            // 3. Try Partial Cancel / Refund Matching
            // If it's an Income transaction, see if we found a matching expense category
            if (!categoryId && tx.amount > 0) {
                const key = `${normalize(tx.description)}:${Math.abs(tx.amount)}`;
                if (refundMap.has(key)) {
                    categoryId = refundMap.get(key)!;
                    console.log(`[AutoCat] Matched Refund: ${tx.description} (${tx.amount}) -> Category ${categoryId}`);
                }
            }

            // Legacy Bridge Hardcode fallback (if parser passed raw strings like 'Expense 6')
            // This relies on parser.ts passing 'Expense 6' as categoryRaw.

            let finalAmount = tx.amount;
            if (tx.type === 'expense') finalAmount = -Math.abs(tx.amount);
            else if (tx.type === 'income') finalAmount = Math.abs(tx.amount);
            else if (tx.type === 'transfer') finalAmount = -Math.abs(tx.amount);

            return {
                user_id: user.id,
                category_id: categoryId,
                amount: finalAmount,
                date: tx.date,
                description: tx.description,
                allocation_status: 'personal',
                source_raw_data: { original_category: tx.categoryRaw, import_type: 'bulk_excel_2025' }
            }
        });

        // Filter out any invalid entries that might violate DB constraints
        const validPayload = payload.filter(p => !isNaN(p.amount) && p.amount !== null && p.amount !== undefined);

        console.log(`[UploadBatch] Valid Payload: ${validPayload.length} / ${payload.length}`);
        if (validPayload.length > 0) {
            console.log(`[UploadBatch] Sample:`, validPayload[0]);
        }

        if (validPayload.length === 0) {
            console.warn("[UploadBatch] No valid transactions to insert.");
            return { success: true, count: 0, errors: ["No valid transactions found to insert."] }
        }

        // 4. Batch Insert
        const { error } = await supabase
            .from('transactions')
            .insert(validPayload as any)

        if (error) {
            console.error("[UploadBatch] Insert Error:", error)
            return { success: false, count: 0, errors: [error.message] }
        }

        console.log(`[UploadBatch] Insert Success! Count: ${validPayload.length}`);
        return { success: true, count: validPayload.length, errors: [] }

    } catch (err: any) {
        console.error("Server Action Error:", err)
        return { success: false, count: 0, errors: [err.message] }
    }
}
