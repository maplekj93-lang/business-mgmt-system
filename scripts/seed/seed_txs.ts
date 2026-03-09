import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Use service role key to bypass all RLS policies
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

import fs from 'fs';
const filePath = '/Users/kwang/Downloads/가계부관련/2025 쾅영부부 가계부 - 가계부 기록.csv';

let decoded = '';
try {
    const fileBuffer = fs.readFileSync(filePath);
    try {
        decoded = new TextDecoder('utf-8', { fatal: true }).decode(fileBuffer);
    } catch {
        decoded = new TextDecoder('euc-kr').decode(fileBuffer);
    }
} catch (err) {
    console.error("File read error:", err);
    process.exit(1);
}

const workbook = XLSX.read(decoded, { type: 'string' });
const sheetName = workbook.SheetNames[0];
const rows = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets[sheetName], { header: 1 });

async function run() {
    const userId = '7b5b7208-f4cf-4103-8b39-fe6285357634';

    console.log("Fetching assets...");
    const { data: assets } = await supabase.from('assets').select('id, name');

    console.log("Fetching categories...");
    const { data: categories } = await supabase.from('mdt_categories').select('id, name, type');

    console.log("Deleting existing transactions to reset...");
    await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    let txRecords = [];

    for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length < 8) continue;

        let dateValue = r[1] ? r[1] : '';
        const typeStr = r[2] ? String(r[2]).trim() : '';
        const mainCat = r[3] ? String(r[3]).trim() : '';
        const subCat = r[4] ? String(r[4]).trim() : '';
        const memo = r[5] ? String(r[5]).trim() : '';
        const amountStr = r[6] ? String(r[6]).trim() : '';
        const inAcc = r[7] ? String(r[7]).trim() : '';
        const outAcc = r[8] ? String(r[8]).trim() : '';

        if (!dateValue || !amountStr) continue;

        let date = '';
        if (typeof dateValue === 'number') {
            date = XLSX.SSF.format('yyyy-mm-dd', dateValue);
        } else {
            date = String(dateValue).trim().replace(/\./g, '-');
        }

        let amount = parseInt(amountStr.replace(/[^0-9\-]/g, ''), 10);
        if (isNaN(amount) || Math.abs(amount) > 9000000000000) {
            console.log("Skipping invalid or overflow amount:", amountStr, "at row", i);
            continue;
        }

        if (typeStr === '지출') amount = -Math.abs(amount);
        else if (typeStr === '수입') amount = Math.abs(amount);
        else continue;

        let dateSql = date;
        if (date.length === 10) dateSql += ' 00:00:00';

        const targetAccount = outAcc || inAcc;
        const targetAccountTrimmed = targetAccount.replace(/\s+/g, "");

        // Find Asset
        // Need fuzzy match to handle spaces "광준 / 사업자 계좌" vs "광준/사업자계좌"
        const assetMatch = assets?.find(a => a.name.replace(/\s+/g, "") === targetAccountTrimmed) || assets?.find(a => targetAccountTrimmed.includes(a.name.replace(/\s+/g, "")));
        const assetId = assetMatch ? assetMatch.id : null;

        // Find Category
        const cType = typeStr === '수입' ? 'income' : 'expense';
        let catMatch = categories?.find(c => c.name === subCat && c.type === cType);
        if (!catMatch) { // fallback to main cat
            catMatch = categories?.find(c => c.name === mainCat && c.type === cType);
        }

        txRecords.push({
            user_id: userId,
            amount,
            date: dateSql,
            description: memo,
            account_id: assetId,
            category_id: catMatch ? catMatch.id : null,
            allocation_status: 'personal',
            source_raw_data: {
                import_type: "BULK_HARDCODED",
                original_category: mainCat + ' > ' + subCat,
                _bank: targetAccount
            }
        });
    }

    console.log(`Ready to insert ${txRecords.length} records! Chunking...`);
    for (let i = 0; i < txRecords.length; i += 100) {
        const chunk = txRecords.slice(i, i + 100);
        const { error } = await supabase.from('transactions').insert(chunk);
        if (error) {
            console.error("Chunk Error at idx", i, error);
            return;
        }
        console.log(`Inserted chunk ${i} to ${i + chunk.length}`);
    }
    console.log("🔥 Migration successfully completed without ANY errors! All records injected!");
}

run();
