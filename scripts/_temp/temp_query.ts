import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data: users, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error(error);
        return;
    }
    if (users?.users?.length > 0) {
        console.log("USER_ID:", users.users[0].id);
    } else {
        console.log("No users found.");
    }
}

main().catch(console.error);
