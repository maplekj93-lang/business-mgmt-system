import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role to bypass RLS
);

async function runPerfectSeed() {
    console.log("🚀 Starting Perfect Seed...");

    // 1. Fetch assets for mapping
    const { data: assets } = await supabase.from('assets').select('id, name');
    const assetMap: Record<string, string> = {};

    // Normalize names for mapping (remove whitespace, fix typos)
    const normalize = (name: string) => name.replace(/\s/g, '').replace(/쾅/g, '광');

    assets?.forEach(a => {
        assetMap[normalize(a.name)] = a.id;
    });

    // 2. Fetch categories for mapping
    const { data: categories } = await supabase.from('mdt_categories').select('id, name');
    const categoryMap: Record<string, number> = {};
    categories?.forEach(c => {
        categoryMap[c.name] = c.id;
    });

    // 3. Clear existing transactions
    console.log("🗑️ Clearing existing transactions...");
    await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 4. Read Excel/CSV
    const filePath = '/Users/kwang/Downloads/가계부관련/2025 쾅영부부 가계부 - 가계부 기록.csv';
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // 5. Build Payload
    const { data: userData } = await supabase.from('profiles').select('id, full_name');
    // Default to 정광준 if available, else first user
    const user = userData?.find(u => u.full_name?.includes('광준')) || userData?.[0];
    const userId = user?.id;

    if (!userId) {
        console.error("User profile not found! Check profiles table.");
        return;
    }
    console.log(`👤 Using User: ${user.full_name} (${userId})`);

    const transactions = [];
    console.log(`📦 Processing ${data.length} records...`);

    for (let i = 0; i < data.length; i++) {
        const row: any = data[i];
        const dateStr = row['날짜'];
        const amountStr = String(row['금액'] || '0');
        const desc = row['내용'] || '';
        const bankName = row['출금계좌'] || '';
        const catName = row['소분류'] || '';
        const typeStr = row['수입/지출'] || '';

        if (!dateStr || dateStr === '날짜') continue;

        // Date check (Excel serial or YYYY-MM-DD)
        let date = dateStr;
        if (typeof dateStr === 'number') {
            const dateObj = new Date((dateStr - 25569) * 86400 * 1000);
            date = dateObj.toISOString().split('T')[0];
        }

        // Amount parsing
        let amount = parseInt(amountStr.replace(/[^0-9\-]/g, ''), 10);
        if (isNaN(amount) || Math.abs(amount) > 1000000000) continue;

        if (typeStr === '지출') amount = -Math.abs(amount);
        else if (typeStr === '수입') amount = Math.abs(amount);

        // Asset Mapping (Smart mapping with typo fix)
        const normalizedBank = normalize(bankName);
        const assetId = assetMap[normalizedBank] || null;

        if (!assetId && bankName) {
            console.warn(`⚠️ Asset not found for: [${bankName}] -> normalized: [${normalizedBank}]`);
        }

        const categoryId = categoryMap[catName] || null;

        transactions.push({
            user_id: userId,
            date: date,
            amount: amount,
            description: desc,
            category_id: categoryId,
            asset_id: assetId,
            allocation_status: 'personal',
            source_raw_data: { _bank: bankName, _cat: catName, _type: typeStr }
        });
    }

    // 6. Bulk Insert
    const chunkSize = 100;
    for (let i = 0; i < transactions.length; i += chunkSize) {
        const chunk = transactions.slice(i, i + chunkSize);
        const { error } = await supabase.from('transactions').insert(chunk);
        if (error) {
            console.error(`❌ Chunk Insert Error at ${i}:`, error);
        } else {
            console.log(`✅ Inserted chunk ${i} to ${i + chunk.length}`);
        }
    }

    console.log("🔥 Perfect Seeding Completed!");
}

runPerfectSeed();
