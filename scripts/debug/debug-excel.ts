import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Helper to find xlsx files
const dir = process.cwd();
const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx'));

if (files.length === 0) {
    console.error("❌ No .xlsx files found in project root.");
    process.exit(1);
}

const filename = files[0];
console.log(`📂 Analyzing file: ${filename}`);

const filepath = path.join(dir, filename);
const fileBuffer = fs.readFileSync(filepath);
const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

console.log("📑 Sheets:", workbook.SheetNames);

const targetSheet = workbook.SheetNames.find(s => s === '가계부 기록') || workbook.SheetNames.find(s => s.includes('가계부')) || workbook.SheetNames[0];
console.log(`Checking Sheet: "${targetSheet}"`);

const sheet = workbook.Sheets[targetSheet];
const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log(`📊 Total Rows: ${rows.length}`);

// Dump first 10 rows to see layout
console.log("\n--- First 10 Rows (Raw) ---");
rows.slice(0, 10).forEach((r, i) => console.log(`[${i}]`, JSON.stringify(r)));

// Diagnose why parsing might fail 
console.log("\n--- Diagnosis ---");

console.log("\n--- Problem Rows Inspection ---");
const problemIndices = [724, 871, 872];
problemIndices.forEach(idx => {
    console.log(`\n[Row ${idx}]:`, JSON.stringify(rows[idx]));
});

// Re-verify Header Map logic for Row 6
const row6 = rows[6] as string[];
console.log("\n--- Helper Map Re-Verification (Row 6) ---");
const colMap: any = {};
row6.forEach((h, idx) => {
    const text = String(h).trim();
    if (text.includes('날짜')) colMap.date = idx;
    if (text.includes('금액')) colMap.amount = idx;
    if (text.includes('구분')) colMap.type = idx;
});
console.log("Estimated Map:", colMap);

// Check Date Parsing on Row 20
if (rows[20]) {
    const r = rows[20];
    // Assuming date is col 1 based on screenshot (B column)
    // But index 1 implies Col B IF Col A exists. 
    // If Col A is empty, it might be index 0 or 1 depending on 'header:1' behavior with empty first col? 
    // Sheet_to_json with header:1 usually includes empty cells as null/undefined but preserves indices if range is correct.

    // Let's print the value at likely indices
    console.log("Row 20 [0]:", r[0]);
    console.log("Row 20 [1]:", r[1]);
    console.log("Row 20 [2]:", r[2]);
}
