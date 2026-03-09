import * as XLSX from 'xlsx';

async function debugCSV() {
    const filePath = '/Users/kwang/Downloads/가계부관련/2025 쾅영부부 가계부 - 가계부 기록.csv';
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const data: any[] = XLSX.utils.sheet_to_json(sheet, { range: 6 });
    console.log("Data Length:", data.length);
    if (data.length > 0) {
        console.log("First Row Keys:", Object.keys(data[0]));
        console.log("First Row Sample:", JSON.stringify(data[0], null, 2));
    }
}

debugCSV();
