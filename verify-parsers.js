const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const SAMPLE_DIR = path.join(__dirname, 'docs/bank_samples/');
const files = fs.existsSync(SAMPLE_DIR) ? fs.readdirSync(SAMPLE_DIR).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls')) : [];

const profiles = [
    { name: 'Samsung Card', keywords: ["카드번호", "본인가족구분", "승인번호"] },
    { name: 'Hyundai Card', keywords: ["현대카드", "이용가맹점", "결제후잔액"] },
    { name: 'BC Card', keywords: ["이용카드", "가맹점명", "승인번호"] },
    { name: 'IBK Account', keywords: ["거래일시", "출금", "입금", "거래후 잔액", "기재내용"] },
    { name: 'Kakao Bank', keywords: ["거래 후 잔액", "거래금액", "거래일시"] },
    { name: 'Kakao Pay', keywords: ["거래일시", "거래구분", "거래금액", "결제 정보"] },
    { name: 'Nelna', keywords: ["가계부 기록"] }
];

if (files.length === 0) {
    console.error('No sample files found in ' + SAMPLE_DIR);
    process.exit(1);
}

console.log(`Checking ${files.length} files in ${SAMPLE_DIR}...`);

files.forEach(file => {
    console.log(`\n--- [${file}] ---`);
    const filePath = path.join(SAMPLE_DIR, file);
    try {
        const workbook = XLSX.readFile(filePath);
        let identifiedCount = 0;
        
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (rows.length === 0) return;

            const headerScanLimit = Math.min(rows.length, 30);
            for (let i = 0; i < headerScanLimit; i++) {
                const row = (rows[i] || []).map(c => String(c || '').replace(/\s/g, '').normalize('NFC').toLowerCase());
                const rowStr = row.join(' ');
                
                for (const profile of profiles) {
                    const profileKeywords = profile.keywords.map(k => k.replace(/\s/g, '').normalize('NFC').toLowerCase());
                    if (profileKeywords.every(k => rowStr.includes(k))) {
                        console.log(`✅ [Sheet: ${sheetName}] Identified as "${profile.name}" at row ${i}`);
                        identifiedCount++;
                        const dataRows = rows.slice(i + 1).filter(r => r && r.length > 0);
                        console.log(`   📊 Rows found: ${dataRows.length}`);
                        break;
                    }
                }
                if (identifiedCount > 0) break;
            }
        });
        
        if (identifiedCount === 0) {
            console.log(`❌ Failed to identify any profile for ${file}`);
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const firstRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }).slice(0, 10);
            const normalizedPeek = firstRows.map(row => 
                (row || []).map(c => String(c || '').replace(/\s/g, '').normalize('NFC'))
            );
            console.log("   Peek at first 10 rows (normalized):", JSON.stringify(normalizedPeek, null, 2));
        }
    } catch (e) {
        console.error(`💥 Error reading ${file}:`, e.message);
    }
});
