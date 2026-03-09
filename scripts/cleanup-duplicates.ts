import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load env
dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key (masked):", supabaseKey.substring(0, 10) + "...");

async function cleanupDuplicates() {
    console.log("🚀 Starting Transaction Cleanup...");

    // 1. Fetch all transactions for a specific user or all users
    // (Assuming single user for this cleanup based on audit)
    const { data: txs, error } = await supabase
        .from('transactions')
        .select('id, user_id, date, amount, description, asset_id')
        .order('date', { ascending: true });

    if (error || !txs) {
        console.error("Failed to fetch transactions:", error);
        return;
    }

    console.log(`📊 Total Transactions: ${txs.length}`);

    const hashToId = new Map<string, string>();
    const duplicates: string[] = [];
    const hashUpdates: { id: string, import_hash: string }[] = [];

    const generateHash = (tx: any) => {
        const hashSource = `${tx.date}|${tx.amount}|${tx.description || ''}|${tx.asset_id || ''}`;
        let hash = 0;
        for (let i = 0; i < hashSource.length; i++) {
            const char = hashSource.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    };

    txs.forEach(tx => {
        const hash = generateHash(tx);
        const key = `${tx.user_id}|${hash}`;

        if (hashToId.has(key)) {
            duplicates.push(tx.id);
        } else {
            hashToId.set(key, tx.id);
            hashUpdates.push({ id: tx.id, import_hash: hash });
        }
    });

    console.log(`🔍 Found ${duplicates.length} duplicate records.`);

    if (duplicates.length > 0) {
        const { error: delError } = await supabase
            .from('transactions')
            .delete()
            .in('id', duplicates);

        if (delError) console.error("❌ Delete Error:", delError);
        else console.log(`✅ Successfully deleted ${duplicates.length} duplicates.`);
    }

    // 2. Backfill hashes for remaining transactions
    console.log(`🔄 Backfilling hashes for ${hashUpdates.length} records...`);

    // Batch updates in chunks to avoid timeout
    const chunkSize = 100;
    for (let i = 0; i < hashUpdates.length; i += chunkSize) {
        const chunk = hashUpdates.slice(i, i + chunkSize);
        const { error: upError } = await supabase
            .from('transactions')
            .upsert(chunk);

        if (upError) console.error(`❌ Update Error at chunk ${i}:`, upError);
        else console.log(`Step ${i + chunk.length}/${hashUpdates.length} done.`);
    }

    console.log("🏁 Cleanup Finished!");
}

cleanupDuplicates();
