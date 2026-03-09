import * as XLSX from 'xlsx';

// Use the main excel file
const filePath = '/Users/kwang/Downloads/가계부관련/2025 쾅영부부 가계부.xlsx';

const workbook = XLSX.readFile(filePath);
console.log("Sheet Names:", workbook.SheetNames);

for (const sheetName of workbook.SheetNames) {
    if (sheetName.includes("설정")) {
        console.log(`\n\n=== SHEET: ${sheetName} ===`);
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }).slice(0, 30); // Top 30 rows
        console.log("Setting Setup Rows:");
        rows.forEach((r, idx) => console.log(`[${idx}]`, r));
    }

    if (sheetName.includes("기록")) {
        console.log(`\n\n=== SHEET: ${sheetName} ===`);
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }).slice(0, 10); // Top 10 rows
        console.log("Record Rows:");
        rows.forEach((r, idx) => console.log(`[${idx}]`, r));
    }
}
