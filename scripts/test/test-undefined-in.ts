import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const transactionIds: any = undefined;
        const { data, error } = await supabaseAdmin
            .from('transactions')
            .update({ category_id: 119 })
            .in('id', transactionIds); // Passing undefined!

        console.log('Result:', { data, error });
    } catch (e) {
        console.error('Exception thrown:', e);
    }
}

test();
