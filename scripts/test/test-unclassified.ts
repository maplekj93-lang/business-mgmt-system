import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const transactionIds = ['e0b4e4f0-4737-4f6f-ba2d-93036aac3892'];
    const updateData: any = { category_id: 119, allocation_status: 'personal' };

    console.log('Testing update for', transactionIds);

    const { data: updateRes, error: txError } = await supabaseAdmin
        .from('transactions')
        .update(updateData)
        .in('id', transactionIds)
        .select();

    console.log('Update result:', { updateRes, txError });
}

test();
