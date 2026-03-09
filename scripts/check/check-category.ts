
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Admin key to bypass RLS for debugging
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Checking Join Syntax ---');

    // Test the exact join used in getTransactions (embedded inside transaction logic usually, but tested in isolation here)
    const { data: cat, error } = await supabase
        .from('mdt_categories')
        .select(`
            id, name, parent_id,
            parent:mdt_categories!parent_id (
                id, name
            )
        `)
        .eq('id', 88)
        .single();

    if (error) {
        console.error('Join Error:', error);
    } else {
        console.log('Join Result:', JSON.stringify(cat, null, 2));
    }
}

check();
