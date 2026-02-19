
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseStats() {
    console.log("🔍 Diagnosing Monthly Stats Logic...");

    // 1. Run the exact query
    console.log("Fetching transactions...");
    const { data, error } = await supabase
        .from('transactions')
        .select(`
            id,
            amount,
            date,
            allocation_status,
            business_unit_id,
            category:mdt_categories ( type )
        `);

    if (error) {
        console.error("Query Error:", error);
        return;
    }

    console.log(`Fetched ${data.length} rows.`);

    let validIncomeCount = 0;
    let validExpenseCount = 0;
    let totalIncome = 0;

    // 2. Simulate the loop
    data.forEach((tx: any, index: number) => {
        const amount = Number(tx.amount);

        // Debug Positive Amounts specifically
        if (amount > 0) {
            console.log(`\n[Found Positive Amount] Row ${index}: ID=${tx.id}, Amount=${amount}, Date=${tx.date}`);
            console.log(`Category Data:`, tx.category);

            // Apply Logic
            let type = 'expense';
            if (tx.category && tx.category.type) {
                type = tx.category.type;
                console.log(`-> Type determined by Category: ${type}`);
            } else {
                if (amount > 0) type = 'income';
                else type = 'expense';
                console.log(`-> Type determined by Fallback (Amount Sign): ${type}`);
            }

            if (type === 'income') {
                validIncomeCount++;
                totalIncome += Math.abs(amount);
            } else {
                console.warn(`-> WARNING: Positive amount but treated as ${type}!`);
            }
        } else {
            validExpenseCount++;
        }
    });

    console.log("\n--- Summary ---");
    console.log(`Rows with Amount > 0: ${validIncomeCount}`);
    console.log(`Calculated Total Income: ${totalIncome}`);
    console.log(`Rows with Amount <= 0: ${validExpenseCount}`);

    if (validIncomeCount === 0) {
        console.log("❌ No positive amounts found in raw DB fetch. Check upload-batch.");
    } else {
        console.log("✅ Check pass locally. If server fails, it might be an environment/cache issue.");
    }
}

diagnoseStats();
