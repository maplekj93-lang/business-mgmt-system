import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Local Supabase DB is usually 54322
const dbConfig = {
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
};

function formatAmount(amtStr: any): number {
    if (!amtStr) return 0;
    if (typeof amtStr === 'number') return amtStr;
    const cleaned = amtStr.toString().replace(/,/g, '').trim();
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed;
}

function parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    let d = String(dateStr).replace(/[-./\s]/g, '');
    if (d.length >= 8) {
        const y = parseInt(d.substring(0, 4));
        const m = parseInt(d.substring(4, 6)) - 1;
        const day = parseInt(d.substring(6, 8));
        return new Date(y, m, day, 12, 0, 0); // Noon to avoid timezone edge cases
    }
    return null;
}

// Ensure same YYYY-MM-DD for comparison
function toLocalYYYYMMDD(d: Date | string | null): string {
    if (!d) return '';
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return '';
    const tzOffset = dateObj.getTimezoneOffset() * 60000; // in milliseconds
    const localISOTime = (new Date(dateObj.getTime() - tzOffset)).toISOString().slice(0, 10);
    return localISOTime;
}

async function run() {
    const client = new Client(dbConfig);
    await client.connect();

    console.log("Connected to DB.");

    try {
        const samplesDir = path.resolve(process.cwd(), 'docs', 'bank_samples');
        const files = fs.readdirSync(samplesDir).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));

        // Fetch existing 2026 transactions that don't have rich source_raw_data yet
        const res = await client.query(`
            SELECT id, 
                   date AT TIME ZONE 'UTC' as utc_date, 
                   amount, 
                   type, 
                   description, 
                   source_raw_data 
            FROM public.transactions 
            WHERE date >= '2026-01-01'
        `);
        const dbTxs = res.rows;
        console.log(`Fetched ${dbTxs.length} 2026 transactions from DB for patching.`);

        let patchedCount = 0;
        let notFoundCount = 0;

        for (const file of files) {
            console.log(`\nProcessing file: ${file}`);
            const filePath = path.join(samplesDir, file);
            const workbook = XLSX.readFile(filePath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

            let headerRowIdx = -1;
            let amountCol = -1;
            let dateCol = -1;

            if (file.includes('삼성카드')) {
                // Samsung Card logic
                for (let i = 0; i < rows.length; i++) {
                    if (rows[i] && rows[i][0] === '이용일자') {
                        headerRowIdx = i;
                        dateCol = 0;
                        amountCol = rows[i].findIndex(h => h === '이용금액'); // usually 7 or 8 depending on format
                        if (amountCol === -1) amountCol = 7;
                        break;
                    }
                }
            } else if (file.includes('Approve')) {
                // BC Card logic
                for (let i = 0; i < rows.length; i++) {
                    if (rows[i] && rows[i][0] === '승인일자') {
                        headerRowIdx = i;
                        dateCol = 0;
                        amountCol = rows[i].findIndex(h => h === '승인금액');
                        break;
                    }
                }
            } else if (file.includes('hyundaicard')) {
                // Hyundai Card
                for (let i = 0; i < rows.length; i++) {
                    if (rows[i] && typeof rows[i][0] === 'string' && rows[i][0].includes('이용일시')) {
                        headerRowIdx = i;
                        dateCol = 0;
                        amountCol = rows[i].findIndex(h => typeof h === 'string' && h.includes('이용금액'));
                        break;
                    }
                }
            } else if (file.includes('카카오뱅크') || file.includes('거래내역조회')) {
                // Bank Accounts
                for (let i = 0; i < rows.length; i++) {
                    if (rows[i] && typeof rows[i][0] === 'string' && rows[i][0].includes('거래일시')) {
                        headerRowIdx = i;
                        dateCol = 0;
                        // Let's just find "출금", "입금" or "거래금액"
                        for (let c = 0; c < rows[i].length; c++) {
                            const val = String(rows[i][c] || '');
                            if (val.includes('출금') || val.includes('거래금액')) {
                                amountCol = c;
                                break;
                            }
                        }
                        break;
                    }
                }
            }

            if (headerRowIdx === -1) {
                console.log(`Could not find header row for ${file}`);
                continue;
            }

            const header = rows[headerRowIdx];

            for (let i = headerRowIdx + 1; i < rows.length; i++) {
                const r = rows[i];
                if (!r || r.length === 0 || !r[dateCol]) continue;

                let rowAmount = 0;

                // Bank accounts sometimes have deposit/withdrawal split in two columns
                if (file.includes('카카오뱅크') || file.includes('거래내역조회')) {
                    // Try to find the non-zero amount between withdrawal and deposit
                    let withdrawal = formatAmount(r[amountCol]);
                    let deposit = formatAmount(r[amountCol + 1]); // Assuming deposit is right next to it, standard in kr banking
                    if (!isNaN(withdrawal) && withdrawal > 0) rowAmount = withdrawal;
                    else if (!isNaN(deposit) && deposit > 0) rowAmount = deposit;
                    else rowAmount = formatAmount(r[amountCol]); // Fallback
                } else {
                    rowAmount = formatAmount(r[amountCol]);
                }

                if (rowAmount === 0) continue; // Skip 0 amounts or header parsing issues

                const rowDate = parseDate(String(r[dateCol]));
                if (!rowDate) continue;

                // Build full raw object
                const rawObj: Record<string, any> = {};
                for (let c = 0; c < header.length; c++) {
                    if (header[c]) {
                        rawObj[String(header[c]).trim()] = r[c] ?? '';
                    }
                }
                rawObj['_source_file'] = file;

                const targetDateStr = toLocalYYYYMMDD(rowDate);

                // Find a match in dbTxs
                // Match criteria: Same date (YYYY-MM-DD), same absolute amount
                const matchIdx = dbTxs.findIndex(tx => {
                    if (tx._matched) return false;
                    const dbDateStr = toLocalYYYYMMDD(tx.utc_date); // Note tx.utc_date is already Date object from pg
                    const dbAmount = Math.abs(Number(tx.amount));
                    return dbDateStr === targetDateStr && dbAmount === rowAmount;
                });

                if (matchIdx !== -1) {
                    // We found a match! Let's update it.
                    const match = dbTxs[matchIdx];
                    match._matched = true; // prevent double matching

                    // Merge existing source_raw_data with new rawObj so we don't lose _bank, _cat, etc.
                    let existingRaw = typeof match.source_raw_data === 'string' ? JSON.parse(match.source_raw_data) : match.source_raw_data;
                    if (!existingRaw) existingRaw = {};

                    const mergedRaw = { ...existingRaw, ...rawObj };

                    // Update in DB
                    await client.query(`
                        UPDATE public.transactions 
                        SET source_raw_data = $1::jsonb 
                        WHERE id = $2
                    `, [JSON.stringify(mergedRaw), match.id]);

                    patchedCount++;
                } else {
                    notFoundCount++;
                }
            }
        }

        console.log(`\nPatch Summary:`);
        console.log(`Total 2026 Txs from DB: ${dbTxs.length}`);
        console.log(`Successfully patched: ${patchedCount}`);
        console.log(`Rows in excel not matched with DB: ${notFoundCount}`);

    } catch (e) {
        console.error("Error during patch run:", e);
    } finally {
        await client.end();
    }
}

run().catch(console.error);
