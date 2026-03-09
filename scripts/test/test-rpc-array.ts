import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin.rpc('get_unclassified_stats_test');
    console.log('Error:', error);
    if (data && data.length > 0) {
        console.log('transaction_ids type:', typeof data[0].transaction_ids);
        console.log('Is Array?', Array.isArray(data[0].transaction_ids));
        console.log('Value:', data[0].transaction_ids);
    }
}

test();
