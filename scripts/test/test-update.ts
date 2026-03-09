import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service key to bypass RLS for reading just in case, but let's test with anon key or user token? 
);

async function test() {
    const { data: tx } = await supabase.from('transactions').select('id, user_id, category_id, allocation_status').is('category_id', null).limit(1);
    if (!tx || tx.length === 0) {
        console.log('No unclassified transactions found');
        return;
    }

    const targetId = tx[0].id;
    const targetUser = tx[0].user_id;

    console.log('Target ID:', targetId, targetUser);

    // Let's attempt to update it using the same updateData
    const updateData = {
        category_id: 119, // test
        allocation_status: 'personal' // Test enum constraint
    };

    const { data, error } = await supabase.from('transactions').update(updateData).eq('id', targetId).select();

    if (error) {
        console.error('Update Error:', error);
    } else {
        console.log('Update Success:', data);
    }
}

test();
