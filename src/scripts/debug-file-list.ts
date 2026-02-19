
import * as fs from 'fs';
import * as path from 'path';

const SAMPLES_DIR = path.join(process.cwd(), 'docs/bank_samples');
const OUT_FILE = path.join(process.cwd(), 'src/scripts/file-list-debug.txt');

const files = fs.readdirSync(SAMPLES_DIR);
const logs = [];

logs.push(`Files in ${SAMPLES_DIR}:`);
files.forEach(f => {
    logs.push(`RAW: ${f}`);
    logs.push(`NFC: ${f.normalize('NFC')}`);
    logs.push(`NFD: ${f.normalize('NFD')}`);
    logs.push(`Includes '카카오'(NFC): ${f.normalize('NFC').includes('카카오')}`);
    logs.push(`Includes '카카오'(NFD): ${f.normalize('NFD').includes('카카오')}`);
    logs.push('---');
});

fs.writeFileSync(OUT_FILE, logs.join('\n'));
