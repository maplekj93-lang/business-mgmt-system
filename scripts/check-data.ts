
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Try Service Role Key first (to bypass RLS), then Anon Key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Env Vars');
    process.exit(1);
}

console.log(`Using Key Type: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE (Admin)' : 'ANON (Public)'}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Checking Transactions ---');
    // Fetch recent transactions
    const { data: txs, error } = await supabase
        .from('transactions')
        .select(`
            id, 
            description, 
            category_id,
            category:mdt_categories!category_id (
                id, name, parent_id,
                parent:mdt_categories!parent_id (
                    id, name
                )
            )
        `)
        .limit(5);

    if (error) {
        console.error('Query Error:', error);
        return;
    }

    if (!txs || txs.length === 0) {
        console.log('No transactions found.');
        return;
    }

    txs.forEach((tx: any) => {
        console.log(`[Tx] ${tx.description}`);
        console.log(`  > Category ID: ${tx.category_id}`);
        console.log(`  > Category Name: ${tx.category?.name}`);
        console.log(`  > Parent ID: ${tx.category?.parent_id}`);
        console.log(`  > Parent Name: ${tx.category?.parent?.name} (Expected if Parent ID exists)`);
        console.log('--------------------------------');
    });
}

check();
