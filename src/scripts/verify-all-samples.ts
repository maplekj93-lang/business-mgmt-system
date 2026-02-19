
import * as fs from 'fs';
import * as path from 'path';
import { parseExcel } from '../features/ledger-import/model/parser';

const SAMPLES_DIR = path.join(process.cwd(), 'docs/bank_samples');

async function run() {
    console.log("🔍 Verifying All Sample Files in:", SAMPLES_DIR);

    if (!fs.existsSync(SAMPLES_DIR)) {
        console.error("❌ Samples directory not found!");
        return;
    }

    const files = fs.readdirSync(SAMPLES_DIR).filter(f => !f.startsWith('.') && (f.endsWith('.xlsx') || f.endsWith('.xls')));

    console.log(`Found ${files.length} files to test.\n`);

    for (const filename of files) {
        console.log(`---------------------------------------------------`);
        console.log(`📄 Testing: ${filename}`);
        const filePath = path.join(SAMPLES_DIR, filename);
        const buffer = fs.readFileSync(filePath);

        // Mock File object for parseExcel
        const fileMock = {
            arrayBuffer: async () => {
                return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
            },
            name: filename,
            size: buffer.length,
            type: filename.endsWith('.xlsx')
                ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                : 'application/vnd.ms-excel'
        } as unknown as File;

        try {
            const result = await parseExcel(fileMock);
            console.log(`✅ Success!`);
            console.log(`   - Bank: ${result.stats.bankIdentified}`);
            console.log(`   - Transactions: ${result.transactions.length}`);
            console.log(`   - Filtered (NetZero): ${result.stats.filteredCount}`);

            if (result.transactions.length > 0) {
                console.log(`   - Sample Tx: ${result.transactions[0].date} | ${result.transactions[0].description} | ${result.transactions[0].amount}`);
            }
        } catch (error) {
            console.error(`❌ FAILED:`, error);
            // Debug: Print first 10 rows to see why it failed
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
            console.log(`   DUMPING FIRST 10 ROWS of ${filename}:`);
            rows.slice(0, 10).forEach((r, i) => console.log(`   Row ${i}:`, JSON.stringify(r)));
        }
    }
}

import * as XLSX from 'xlsx';
run().catch(console.error);
