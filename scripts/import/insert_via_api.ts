import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const recordsPath = path.resolve(process.cwd(), 'scripts', 'import_2026_data.json');
const records = JSON.parse(fs.readFileSync(recordsPath, 'utf8'));

async function run() {
    console.log(`Starting insertion of ${records.length} records...`);
    for (let i = 0; i < records.length; i += 100) {
        const chunk = records.slice(i, i + 100);
        const { error } = await supabase.from('transactions').insert(chunk);
        if (error) {
            console.error(`Error inserting chunk ${i} to ${i + 100}:`, error);
            return;
        }
        console.log(`Successfully inserted records ${i} to ${i + chunk.length}`);
    }
    console.log('All records inserted successfully!');
}

run();
