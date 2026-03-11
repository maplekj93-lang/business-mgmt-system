'use server'

import { createClient } from '@/shared/api/supabase/server'
import { ValidatedTransaction } from '../model/types'

type ImportResult = {
    success: boolean
    count: number
    addedCount: number
    duplicateCount: number
    errors: string[]
}

export async function uploadBatchAction(transactions: ValidatedTransaction[]): Promise<ImportResult> {
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, count: 0, addedCount: 0, duplicateCount: 0, errors: ['Unauthorized: Please log in.'] }
    }

    try {
        // 2. Fetch Categories for Mapping
        // We need to map "Main > Sub" or "Main" to category_id
        const { data: categories } = await supabase
            .from('mdt_categories')
            .select('id, name, parent_id');

        // 3. Transform Data
        console.log(`[UploadBatch] Processing ${transactions.length} transactions for user ${user.id}`);

        // Fetch Rules
        const { data: rules } = await supabase
            .from('mdt_allocation_rules')
            .select('keyword, category_id')
            .eq('user_id', user.id);

        // [NEW] Fetch Assets with Metadata and Manual Mappings
        const [{ data: assets }, { data: mappings }] = await Promise.all([
            supabase
                .from('assets')
                .select('id, name, asset_type, owner_type, identifier_keywords')
                .eq('user_id', user.id),
            supabase
                .from('mdt_import_mappings')
                .select('type, source_value, target_asset_id')
                .eq('user_id', user.id)
        ]);

        // Helper to find asset by simplified name or card number
        const findAssetId = (bankName?: string, cardNo?: string): string | null => {
            if (!assets) return null;

            // 1. [PRIORITY] Try Manual Settings (mdt_import_mappings)
            if (mappings && mappings.length > 0) {
                // Check by Card Number (last 4 digits)
                if (cardNo) {
                    const last4 = String(cardNo).slice(-4);
                    const match = mappings.find(m => m.type === 'card_no' && m.source_value.includes(last4));
                    if (match) return match.target_asset_id;
                }

                // Check by Bank Name
                if (bankName) {
                    const normalizedBank = normalize(bankName).toUpperCase();
                    const match = mappings.find(m => m.type === 'bank_name' && normalize(m.source_value).toUpperCase() === normalizedBank);
                    if (match) return match.target_asset_id;
                }
            }

            // 2. Try Card Number Match via Metadata / Name heuristic (if cardNo available)
            if (cardNo) {
                const last4 = String(cardNo).slice(-4);
                const match = assets.find(a => {
                    const identifiers = a.identifier_keywords || [];
                    if (identifiers.some((id: string) => String(id).includes(last4))) return true;
                    if (a.name.includes(last4)) return true;
                    return false;
                });
                if (match) return match.id;
            }

            if (!bankName) return null;

            // 3. Fallback: Hardcoded bank name mapping
            const normalizedInput = normalize(bankName).toUpperCase();
            const bankMapping: Record<string, string> = {
                'SAMSUNGCARD': '삼성카드',
                'KAKAOBANK': '카카오뱅크',
                'SHINHANCARD': '신한카드',
                'WOORIBANK': '우리은행',
                'IBK': '기업은행',
                'HYUNDAICARD': '현대카드',
                'KB': '국민카드',
                'CITI': '씨티카드',
                'LOTTECARD': '롯데카드'
            };

            const targetKorean = bankMapping[normalizedInput] || normalizedInput;
            const match = assets.find(a => {
                const normName = normalize(a.name).toUpperCase();
                if (targetKorean.includes(normName) || normName.includes(targetKorean)) return true;

                // Check if any identifier matches targetKorean or vice versa
                const identifiers = a.identifier_keywords || [];
                return identifiers.some((id: string) => {
                    const normId = normalize(id).toUpperCase();
                    return targetKorean.includes(normId) || normId.includes(targetKorean);
                });
            });
            return match ? match.id : null;
        };

        // Helper to normalize strings (remove all spaces) for loose matching
        const normalize = (s: string) => s.replace(/\s+/g, '');

        const ruleMap = new Map<string, number>();
        rules?.forEach(r => {
            if (r.category_id !== null) {
                ruleMap.set(normalize(r.keyword), r.category_id);
            }
        });

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
                .limit(500); // Guard against too much data

            if (history) {
                history.forEach(h => {
                    // Key: "Merchant:Abs(Amount)"
                    // If we find an expense of -10000 for "Starbucks", and we have a refund of +10000 for "Starbucks"
                    const key = `${normalize(h.description!)}:${Math.abs(h.amount)}`;
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

            // 4. [NEW] Link Account (Asset)
            const explicitAccountHint = tx.source_raw_data?.deposit_account || tx.source_raw_data?.withdrawal_account;
            const bankName = explicitAccountHint || tx.source_raw_data?._bank || tx.source_raw_data?.import_type; // Fallback to import type if needed
            const cardNo = tx.source_raw_data?.card_no;
            const accountId = findAssetId(bankName, cardNo);

            let finalAmount = tx.amount;
            if (tx.type === 'expense') finalAmount = -Math.abs(tx.amount);
            else if (tx.type === 'income') finalAmount = Math.abs(tx.amount);
            else if (tx.type === 'transfer') finalAmount = Math.abs(tx.amount);

            // DB schema: date = DATE only, transaction_time = TIME separately
            const rawDate = tx.date; // e.g. "2025-01-01T18:24:11" or "2025-01-01"
            const finalDate = rawDate.split('T')[0].split(' ')[0]; // "2025-01-01"
            const timePart = rawDate.includes('T') ? rawDate.split('T')[1] : null; // "18:24:11" or null

            return {
                user_id: user.id,
                category_id: categoryId,
                amount: finalAmount,
                date: finalDate,
                ...(timePart ? { transaction_time: timePart } : {}),
                description: tx.description,
                allocation_status: 'personal', // All imported ledger data is personal
                asset_id: accountId,
                source_raw_data: { original_category: tx.categoryRaw, import_type: 'bulk_excel_2025', _bank: explicitAccountHint || tx.source_raw_data?._bank },
            }
        });

        // Filter out any invalid entries that might violate DB constraints OR are 0 (useless data)
        const validPayload = payload.filter(p => 
            !isNaN(p.amount) && 
            p.amount !== null && 
            p.amount !== undefined &&
            p.amount !== 0
        );

        console.log(`[UploadBatch] Valid Payload: ${validPayload.length} / ${payload.length}`);
        if (validPayload.length > 0) {
            console.log(`[UploadBatch] Sample:`, validPayload[0]);
        }

        if (validPayload.length === 0) {
            console.warn("[UploadBatch] No valid transactions to insert.");
            return { success: true, count: 0, addedCount: 0, duplicateCount: 0, errors: ["No valid transactions found to insert."] }
        }

        // 5. Create Import Batch
        const filename = transactions[0]?.source_raw_data?._filename || 'unknown_file';
        const { data: batch, error: batchError } = await supabase
            .from('import_batches')
            .insert({
                user_id: user.id,
                filename,
                import_type: transactions[0]?.source_raw_data?.import_type || 'bulk_excel',
                row_count: validPayload.length,
                metadata: { source: 'web_import_v2' }
            } as any)
            .select('id')
            .single();

        if (batchError) {
            console.error("[UploadBatch] Batch Creation Error:", batchError);
            return { success: false, count: 0, addedCount: 0, duplicateCount: 0, errors: [batchError.message] };
        }

        // 6. Generate Hashes for Deduplication
        // We use Crypto (Web Crypto API or Node crypto) or simple string concat
        const encoder = new TextEncoder();
        const generateHash = async (data: string) => {
            // Using a simple but effective hash since we are in a server action
            let hash = 0;
            for (let i = 0; i < data.length; i++) {
                const char = data.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return Math.abs(hash).toString(36);
        };

        const finalPayloadWithHashes = await Promise.all(validPayload.map(async (p) => {
            const hashSource = `${p.date}|${p.amount}|${p.description || ''}|${p.asset_id || ''}`;
            const hash = await generateHash(hashSource);
            return {
                ...p,
                import_batch_id: batch.id,
                import_hash: hash,
                source: 'EXCEL'
            };
        }));

        // 7. Deduplication Check (Check if hashes already exist in DB)
        const hashesToInsert = finalPayloadWithHashes.map(p => p.import_hash);
        const { data: existingHashes } = await supabase
            .from('transactions')
            .select('import_hash')
            .eq('user_id', user.id)
            .in('import_hash', hashesToInsert);

        const existingHashSet = new Set(existingHashes?.map(h => h.import_hash) || []);
        const nonDuplicatePayload = finalPayloadWithHashes.filter(p => !existingHashSet.has(p.import_hash));
        const duplicateCount = finalPayloadWithHashes.length - nonDuplicatePayload.length;

        if (nonDuplicatePayload.length === 0) {
            // All were duplicates - Delete the empty batch for cleanliness
            await supabase.from('import_batches' as any).delete().eq('id', batch.id);
            return { success: true, count: validPayload.length, addedCount: 0, duplicateCount, errors: [] };
        }

        // 8. Batch Insert
        const { error } = await supabase
            .from('transactions')
            .insert(nonDuplicatePayload);

        if (error) {
            console.error("[UploadBatch] Insert Error:", error)
            await supabase.from('import_batches').delete().eq('id', batch!.id);
            return { success: false, count: 0, addedCount: 0, duplicateCount: 0, errors: [error.message] }
        }

        console.log(`[UploadBatch] Insert Success! Added: ${nonDuplicatePayload.length}, Duplicates: ${duplicateCount}`);
        return {
            success: true,
            count: validPayload.length,
            addedCount: nonDuplicatePayload.length,
            duplicateCount,
            errors: []
        }

    } catch (err: any) {
        console.error("Server Action Error:", err)
        return { success: false, count: 0, addedCount: 0, duplicateCount: 0, errors: [err.message] }
    }
}
