const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const sampleDir = path.join(__dirname, '../docs', 'bank_samples');
const files = fs.readdirSync(sampleDir).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));

files.forEach(file => {
    console.log(`\n============================`);
    console.log(`Analyzing: ${file}`);
    console.log(`============================`);
    try {
        const filePath = path.join(sampleDir, file);
        const workbook = XLSX.readFile(filePath);

        workbook.SheetNames.forEach(sheetName => {
            console.log(`\nSheet: ${sheetName}`);
            const worksheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

            // Print first 10 rows to understand the structure
            const previewRows = rows.slice(0, 10);
            previewRows.forEach((row, i) => {
                if (row.length > 0) {
                    console.log(`Row ${i}:`, row);
                }
            });
        });
    } catch (e) {
        console.error(`Error reading ${file}:`, e.message);
    }
});
