const XLSX = require('xlsx');
const fs = require('fs');
fs.writeFileSync('test.csv', 'Date,Content,Amount\n2025-01-01,Test,1000');
const workbook = XLSX.readFile('test.csv');
console.log(workbook.SheetNames);
