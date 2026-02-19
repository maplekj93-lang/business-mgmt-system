
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Service Role would be better but trying anon first

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategories() {
    console.log('Checking Categories...');

    // Fetch all categories
    const { data, error } = await supabase
        .from('mdt_categories')
        .select('id, name, parent_id, type')
        .order('id');

    if (error) {
        console.error('Error:', error);
        return;
    }

    // Check for parents
    const parents = data.filter(c => !c.parent_id);
    const children = data.filter(c => c.parent_id);

    console.log(`Total Categories: ${data.length}`);
    console.log(`Parents (Top-level): ${parents.length}`);
    console.log(`Children (Sub-level): ${children.length}`);

    // Log sample children
    console.log('\nSample Children with their Parents:');
    children.slice(0, 10).forEach(child => {
        const parent = data.find(p => p.id === child.parent_id);
        console.log(`- Child: ${child.name} (ID: ${child.id}) -> Parent: ${parent?.name} (ID: ${child.parent_id})`);
    });
}

checkCategories();
