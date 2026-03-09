import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

const fp = 'docs/bank_samples/거래내역조회_입출식 예금20260217.xlsx';
const workbook = XLSX.readFile(fp);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
let headerRowIdx = 2; // the actual header
let topAccNum = '';
for (let j = 0; j < headerRowIdx; j++) {
    let rowStr = Array.from(rows[j] || []).join('');
    let match = rowStr.match(/([0-9-]{10,})/);
    if (match) { topAccNum = match[1].replace(/-/g, ''); }
    console.log(`j=${j}, rowStr: ${rowStr.substring(0, 50)}... match: ${match}`);
}
console.log('Final topAccNum', topAccNum, 'StartsWith 048:', topAccNum.startsWith('048'));
