
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function countTransactions() {
    console.log("📊 Checking Transaction Counts...");

    const { count, error } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error("Error counting all:", error);
    } else {
        console.log(`Total Transactions: ${count}`);
    }

    // Check 2024 vs 2025
    const { count: count2024 } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .gte('date', '2024-01-01')
        .lte('date', '2024-12-31');

    console.log(`2024 Transactions: ${count2024}`);

    const { count: count2025 } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .gte('date', '2025-01-01')
        .lte('date', '2025-12-31');

    console.log(`2025 Transactions: ${count2025}`);

    // Check for recent imports
    const { data: recent } = await supabase
        .from('transactions')
        .select('created_at, date, amount, description')
        .order('created_at', { ascending: false })
        .limit(5);

    console.log("\nRecent 5 Insertions:");
    console.table(recent);
}

countTransactions();
