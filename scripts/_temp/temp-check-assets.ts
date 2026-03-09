import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function main() {
    console.log("URL:", supabaseUrl?.slice(0, 15) + "...");
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('assets').select('*');
    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`Found ${data.length} assets.`);
        console.log("Users:", Array.from(new Set(data.map(d => d.user_id))));
    }
}
main();
