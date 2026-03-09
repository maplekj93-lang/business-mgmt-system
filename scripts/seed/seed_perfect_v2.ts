import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

// Hardcoded for reliability in this specific environment
const SUPABASE_URL = 'https://xjqrmqbbpkwwqiflptyz.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqcXJtcWJicGt3d3FpZmxwdHl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY5NDkxNCwiZXhwIjoyMDg1MjcwOTE0fQ.527P0adow39o9znqtK434GK4ZksBFVQRbyROmyoBu18';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runPerfectSeed() {
    console.log("🚀 Starting Perfect Seed (v2)...");

    const userId = '7b5b7208-f4cf-4103-8b39-fe6285357634'; // 정광준 ID
    console.log(`👤 Using User ID: ${userId}`);

    // 1. Fetch assets for mapping
    const { data: assets, error: assetErr } = await supabase.from('assets').select('id, name');
    if (assetErr) throw assetErr;

    const assetMap: Record<string, string> = {};
    const normalize = (name: string) => name.replace(/\s/g, '').replace(/쾅/g, '광');

    assets?.forEach(a => {
        assetMap[normalize(a.name)] = a.id;
    });
    console.log(`✅ Loaded ${assets?.length} assets for mapping.`);

    // 2. Fetch categories
    const { data: categories, error: catErr } = await supabase.from('mdt_categories').select('id, name');
    if (catErr) throw catErr;
    const categoryMap: Record<string, number> = {};
    categories?.forEach(c => { categoryMap[c.name] = c.id; });

    // 3. Clear existing transactions
    console.log("🗑️ Clearing existing transactions...");
    await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 4. Read CSV
    const filePath = '/Users/kwang/Downloads/가계부관련/2025 쾅영부부 가계부 - 가계부 기록.csv';
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

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

        let date = dateStr;
        if (typeof dateStr === 'number') {
            const dateObj = new Date((dateStr - 25569) * 86400 * 1000);
            date = dateObj.toISOString().split('T')[0];
        }

        let amount = parseInt(amountStr.replace(/[^0-9\-]/g, ''), 10);
        if (isNaN(amount)) continue;

        if (typeStr === '지출') amount = -Math.abs(amount);
        else if (typeStr === '수입') amount = Math.abs(amount);

        const normalizedBank = normalize(bankName);
        const assetId = assetMap[normalizedBank] || null;

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

    // 5. Bulk Insert
    const chunkSize = 100;
    for (let i = 0; i < transactions.length; i += chunkSize) {
        const chunk = transactions.slice(i, i + chunkSize);
        const { error } = await supabase.from('transactions').insert(chunk);
        if (error) console.error(`❌ Chunk Insert Error ${i}:`, error);
        else console.log(`✅ ${i + chunk.length} / ${transactions.length} rows inserted.`);
    }

    console.log("🔥 Perfect Seeding Completed!");
}

runPerfectSeed().catch(console.error);
