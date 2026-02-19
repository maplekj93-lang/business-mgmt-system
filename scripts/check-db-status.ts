
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Using Anon for now, might need Service Role if RLS blocks

// Use Service Role if available for admin check, otherwise Anon
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("🔍 Checking Database Status...");

    // 1. Check Categories
    const { data: categories, error: catError } = await supabase
        .from('mdt_categories')
        .select('id, name, type')
        .limit(10);

    if (catError) console.error("❌ Categories Error:", catError.message);
    else {
        const { count } = await supabase.from('mdt_categories').select('*', { count: 'exact', head: true });
        console.log(`✅ Categories Found: ${count} total`);
        console.log("   Sample:", categories);
    }

    // 2. Check Transactions
    const { data: txs, error: txError } = await supabase
        .from('transactions')
        .select('id, date, amount, category_id, source_raw_data')
        .limit(5);

    if (txError) console.error("❌ Transactions Error:", txError.message);
    else {
        const { count } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
        console.log(`✅ Transactions Found: ${count} total`);
        console.log("   Sample:", JSON.stringify(txs, null, 2));
    }
}

check();
