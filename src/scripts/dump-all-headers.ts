
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

const SAMPLES_DIR = path.join(process.cwd(), 'docs/bank_samples');
const OUT_FILE = path.join(process.cwd(), 'src/scripts/all-headers-dump.txt');

const files = fs.readdirSync(SAMPLES_DIR).filter(f => f.endsWith('.xlsx'));
const logs: string[] = [];

files.forEach(f => {
    logs.push(`\n=== FILE: ${f} ===`);
    try {
        const buff = fs.readFileSync(path.join(SAMPLES_DIR, f));
        const wb = XLSX.read(buff, { type: 'buffer' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

        rows.slice(0, 40).forEach((r, i) => { // Dump 40 rows
            logs.push(`[${i}] ${JSON.stringify(r)}`);
        });
    } catch (e) {
        logs.push(`ERROR reading file: ${e}`);
    }
});

fs.writeFileSync(OUT_FILE, logs.join('\n'));
console.log("Dump finished");
