
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

const SAMPLES_DIR = path.join(process.cwd(), 'docs/bank_samples');
const TARGET_FILE = '카카오뱅크_거11래내역_N5410814064_2026021710402077.xlsx';

async function run() {
    const filePath = path.join(SAMPLES_DIR, TARGET_FILE);
    if (!fs.existsSync(filePath)) {
        // Try to handle unicode normalization issues in filename
        const files = fs.readdirSync(SAMPLES_DIR);
        console.log("Available files:", files);
        const match = files.find(f => f.normalize('NFC').includes('카카오뱅크'));
        if (match) {
            const dumpPath = path.join(process.cwd(), 'src/scripts/kakao-dump.txt');
            console.log(`Found file: ${match}`);
            const buff = fs.readFileSync(path.join(SAMPLES_DIR, match));
            const wb = XLSX.read(buff, { type: 'buffer' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

            const lines = rows.slice(0, 50).map((r, i) => `[${i}] ${JSON.stringify(r)}`);
            fs.writeFileSync(dumpPath, lines.join('\n'));
            console.log(`Dump written to ${dumpPath}`);
        } else {
            console.error("File not found!");
        }
    }
}

run();
