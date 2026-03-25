'use server'

import { createClient } from '@/shared/api/supabase/server'
import { ValidatedTransaction } from '../model/types'
import { MatchingEngine } from '@/entities/transaction/lib/matching-engine'
import { applyTaggingRules } from '@/features/refine-ledger/api/apply-tagging-rules'

type ImportResult = {
    success: boolean
    count: number
    addedCount: number
    duplicateCount: number
    pendingCount: number // [NEW] 확인 필요한 내역 수
    errors: string[]
    insertedIds?: string[]
}

export async function uploadBatchAction(transactions: ValidatedTransaction[], forcedAssetId?: string): Promise<ImportResult> {
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, count: 0, addedCount: 0, duplicateCount: 0, pendingCount: 0, errors: ['Unauthorized: Please log in.'], insertedIds: [] }
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

        // [NEW] Helper to get owner_type from assetId
        const getAssetOwnerType = (assetId: string | null): string | null => {
            if (!assetId || !assets) return null;
            const asset = assets.find(a => a.id === assetId);
            return asset ? asset.owner_type : null;
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
        const sourceExpenses = transactions.filter(t => t.amount < 0);

        // [PHASE 2] Run AI Matching Engine on the whole batch
        const matchResults = MatchingEngine.processBatch(transactions);

        let totalPendingCount = 0;

        const payload = matchResults.map(match => {
            const tx = match.transaction;
            let categoryId: number | null = null;
            let rawForRule = tx.categoryRaw ? normalize(tx.categoryRaw) : '';

            // [Phase 2] Use Match Suggestions
            let status: string = 'personal';
            if (match.isSuggested) {
                status = 'pending';
                totalPendingCount++;
            }

            // 1. Try Category Matching (Main > Sub)
            if (tx.categoryRaw) {
                const parts = tx.categoryRaw.split('>').map(p => p.trim());
                if (parts.length > 1) {
                    const subName = parts[parts.length - 1];
                    categoryId = categoryMap.get(subName) || normalizedCatMap.get(normalize(subName)) || null;
                } else {
                    categoryId = categoryMap.get(tx.categoryRaw) || normalizedCatMap.get(normalize(tx.categoryRaw)) || null;
                }
            }

            // 2. Try Rule Matching
            if (!categoryId && rawForRule) {
                for (const [key, catId] of ruleMap.entries()) {
                    if (rawForRule.includes(key)) {
                        categoryId = catId;
                        break;
                    }
                }
            }

            // [Phase 2] Suggestion Override
            if (match.suggestionType === 'transfer') {
                status = 'pending';
            }

            // Asset Linking
            const explicitAccountHint = (tx.source_raw_data as any)?._bank;
            const accountId = forcedAssetId || findAssetId(explicitAccountHint, tx.cardNo);

            // 2026 Strictness
            const rawDate = tx.date;
            const finalDate = rawDate.split('T')[0].split(' ')[0];
            const is2026OrLater = new Date(finalDate).getFullYear() >= 2026;
            
            if (match.isSuggested && is2026OrLater) status = 'pending';

            const amountStr = String(tx.amount).replace(/,/g, '');
            const finalAmount = parseFloat(amountStr);
            const timePart = tx.transactionTime || null;

            return {
                user_id: user.id,
                category_id: categoryId,
                amount: finalAmount,
                date: finalDate,
                ...(timePart ? { transaction_time: timePart } : {}),
                description: tx.description,
                raw_description: tx.raw_description,
                normalized_name: tx.normalized_name || tx.description,
                allocation_status: status,
                asset_id: accountId,
                owner_type: getAssetOwnerType(accountId) || 'other',
                source_raw_data: { 
                    original_category: tx.categoryRaw, 
                    import_type: 'bulk_excel_2025', 
                    _bank: explicitAccountHint,
                    ai_confidence: match.confidence,
                    ai_suggestion_type: match.suggestionType,
                    ...(match.metadata || {}),
                },
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
        
        if (validPayload.length === 0) {
            console.warn("[UploadBatch] No valid transactions to insert.");
            return { success: true, count: 0, addedCount: 0, duplicateCount: 0, pendingCount: 0, errors: ["No valid transactions found to insert."], insertedIds: [] }
        }

        // 5. Create Import Batch
        const filename = (transactions[0]?.source_raw_data as any)?._filename || 'unknown_file';
        const { data: batch, error: batchError } = await supabase
            .from('import_batches')
            .insert({
                user_id: user.id,
                filename,
                import_type: (transactions[0]?.source_raw_data as any)?.import_type || 'bulk_excel',
                row_count: validPayload.length,
                metadata: { source: 'web_import_v2' }
            } as any)
            .select('id')
            .single();

        if (batchError) {
            console.error("[UploadBatch] Batch Creation Error:", batchError);
            return { success: false, count: 0, addedCount: 0, duplicateCount: 0, pendingCount: 0, errors: [batchError.message], insertedIds: [] };
        }

        // 6. Generate Hashes for Deduplication
        const generateHash = async (data: string) => {
            let hash = 0;
            for (let i = 0; i < data.length; i++) {
                const char = data.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = (hash & hash);
            }
            return Math.abs(hash).toString(36);
        };

        const finalPayloadWithHashes = await Promise.all(validPayload.map(async (p) => {
            const hashSource = `${p.date}|${p.amount}|${p.raw_description || p.description || ''}|${p.asset_id || ''}`;
            const hash = await generateHash(hashSource);
            return {
                ...p,
                import_batch_id: batch.id,
                import_hash: hash,
                source: 'EXCEL'
            };
        }));

        // 7. Deduplication Check
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
            await supabase.from('import_batches').delete().eq('id', batch.id);
            return { success: true, count: validPayload.length, addedCount: 0, duplicateCount, pendingCount: 0, errors: [] };
        }

        // 8. Batch Insert
        const { data: insertedData, error } = await supabase
            .from('transactions')
            .insert(nonDuplicatePayload)
            .select('id');

        if (error) {
            console.error("[UploadBatch] Insert Error:", error)
            await supabase.from('import_batches').delete().eq('id', batch.id);
            return { success: false, count: 0, addedCount: 0, duplicateCount: 0, pendingCount: 0, errors: [error.message], insertedIds: [] }
        }

        // [NEW] 후기 처리: 자동 태깅 룰 적용
        const insertedIds = insertedData?.map(d => d.id) || [];
        if (insertedIds.length > 0) {
            console.log(`[UploadBatch] Triggering auto-tagging for ${insertedIds.length} transactions...`);
            await applyTaggingRules(insertedIds);
        }

        // Count pending in actual inserted payload
        const insertedPendingCount = nonDuplicatePayload.filter(p => p.allocation_status === 'pending').length;

        console.log(`[UploadBatch] Insert Success! Added: ${nonDuplicatePayload.length}, Duplicates: ${duplicateCount}, Pending: ${insertedPendingCount}`);
        return {
            success: true,
            count: validPayload.length,
            addedCount: nonDuplicatePayload.length,
            duplicateCount,
            pendingCount: insertedPendingCount,
            errors: [],
            insertedIds: insertedData?.map(d => d.id) || []
        }

    } catch (err: any) {
        console.error("Server Action Error:", err)
        return { success: false, count: 0, addedCount: 0, duplicateCount: 0, pendingCount: 0, errors: [err.message], insertedIds: [] }
    }
}
