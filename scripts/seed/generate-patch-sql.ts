import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

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
        return new Date(y, m, day, 12, 0, 0); // Noon
    }
    return null;
}

function toLocalYYYYMMDD(d: Date | string | null): string {
    if (!d) return '';
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return '';
    const tzOffset = dateObj.getTimezoneOffset() * 60000;
    return (new Date(dateObj.getTime() - tzOffset)).toISOString().slice(0, 10);
}

// Read the dumped DB txt file
const dbTxsStr = fs.readFileSync(path.resolve(process.cwd(), 'scripts', 'db_txs.json'), 'utf-8');
const dbTxs = JSON.parse(dbTxsStr);

const samplesDir = path.resolve(process.cwd(), 'docs', 'bank_samples');
const files = fs.readdirSync(samplesDir).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));

const sqlUpdates: string[] = [];

for (const file of files) {
    const filePath = path.join(samplesDir, file);
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

    let headerRowIdx = -1;
    let amountCol = -1;
    let dateCol = -1;

    if (file.includes('삼성카드')) {
        for (let i = 0; i < rows.length; i++) {
            if (rows[i] && rows[i][0] === '이용일자') {
                headerRowIdx = i; dateCol = 0;
                amountCol = rows[i].findIndex(h => h === '이용금액');
                if (amountCol === -1) amountCol = 7;
                break;
            }
        }
    } else if (file.includes('Approve')) {
        for (let i = 0; i < rows.length; i++) {
            if (rows[i] && rows[i][0] === '승인일자') {
                headerRowIdx = i; dateCol = 0;
                amountCol = rows[i].findIndex(h => h === '승인금액');
                break;
            }
        }
    } else if (file.includes('hyundaicard')) {
        for (let i = 0; i < rows.length; i++) {
            if (rows[i] && typeof rows[i][0] === 'string' && rows[i][0].includes('이용일시')) {
                headerRowIdx = i; dateCol = 0;
                amountCol = rows[i].findIndex(h => typeof h === 'string' && h.includes('이용금액'));
                break;
            }
        }
    } else {
        for (let i = 0; i < rows.length; i++) {
            if (rows[i] && typeof rows[i][0] === 'string' && rows[i][0].includes('거래일시')) {
                headerRowIdx = i; dateCol = 0;
                for (let c = 0; c < rows[i].length; c++) {
                    const val = String(rows[i][c] || '');
                    if (val.includes('출금') || val.includes('거래금액')) { amountCol = c; break; }
                }
                break;
            }
        }
    }

    if (headerRowIdx === -1) continue;

    const header = rows[headerRowIdx];

    for (let i = headerRowIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length === 0 || !r[dateCol]) continue;

        let rowAmount = 0;
        if (file.includes('카카오뱅크') || file.includes('거래내역조회')) {
            let withdrawal = formatAmount(r[amountCol]);
            let deposit = formatAmount(r[amountCol + 1]);
            if (!isNaN(withdrawal) && withdrawal > 0) rowAmount = withdrawal;
            else if (!isNaN(deposit) && deposit > 0) rowAmount = deposit;
            else rowAmount = formatAmount(r[amountCol]);
        } else {
            rowAmount = formatAmount(r[amountCol]);
        }

        if (rowAmount === 0) continue;

        const rowDate = parseDate(String(r[dateCol]));
        if (!rowDate) continue;

        const rawObj: Record<string, any> = {};
        for (let c = 0; c < header.length; c++) {
            if (header[c]) {
                // Safely format strings for JSON escaping
                rawObj[String(header[c]).trim()] = r[c] ?? '';
            }
        }
        rawObj['_source_file'] = file;

        const targetDateStr = toLocalYYYYMMDD(rowDate);

        const matchIdx = dbTxs.findIndex((tx: any) => {
            if (tx._matched) return false;
            const dbDateStr = toLocalYYYYMMDD(tx.date);
            const dbAmount = Math.abs(Number(tx.amount));
            return dbDateStr === targetDateStr && dbAmount === rowAmount;
        });

        if (matchIdx !== -1) {
            const match = dbTxs[matchIdx];
            match._matched = true;

            let existingRaw = typeof match.source_raw_data === 'string' ? JSON.parse(match.source_raw_data) : match.source_raw_data;
            if (!existingRaw) existingRaw = {};

            const mergedRaw = { ...existingRaw, ...rawObj };

            // Escape single quotes for SQL string literal
            const jsonStr = JSON.stringify(mergedRaw).replace(/'/g, "''");
            sqlUpdates.push(`UPDATE public.transactions SET source_raw_data = '${jsonStr}'::jsonb WHERE id = '${match.id}';`);
        }
    }
}

fs.writeFileSync(path.resolve(process.cwd(), 'scripts', 'patch_sql.sql'), sqlUpdates.join('\n'));
console.log(`Generated ${sqlUpdates.length} SQL UPDATE queries.`);
