
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Finding Constraint Name ---');

    // We can't query system catalogs via API easily unless exposed.
    // Instead, let's try the generic join and see the error hint.
    const { data, error } = await supabase
        .from('mdt_categories')
        .select(`
            id, name,
            parent:mdt_categories (id, name)
        `)
        .eq('id', 89)
        .single();

    if (error) {
        console.log('Error Hint:', error.hint);
        console.log('Error Message:', error.message);
    } else {
        console.log('Success (Ambiguous?):', JSON.stringify(data, null, 2));
    }
}

check();
