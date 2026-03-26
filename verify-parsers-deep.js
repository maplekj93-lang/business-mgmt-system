const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function parseAmount(val) {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (typeof val === 'string') {
        const parsed = parseFloat(val.replace(/[^0-9.-]/g, ''));
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

function parseDate(val) {
    if (typeof val === 'number') {
        const date = XLSX.SSF.parse_date_code(val);
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
    const str = String(val).trim();
    if (str.length === 0) return '';
    let d = str.replace(/[\.\/]/g, '-').replace(/[년월]/g, '-').replace(/일/g, ' ').trim();
    return d.split(/[\sT\n]+/)[0];
}

const profiles = [
    {
        name: "Kakao Pay",
        keywords: ["거래일시", "거래구분", "거래금액", "결제 정보"],
        mapping: { date: "거래일시", amount: "거래금액", merchant: ["계좌 정보 / 결제 정보", "결제 정보", "계좌정보/결제정보"] }
    },
    {
        name: "Kakao Bank",
        keywords: ["거래후 잔액", "거래금액", "거래일시"],
        mapping: { date: "거래일시", amount: "거래금액", merchant: ["거래내용", "내용"] }
    },
    {
        name: "Samsung Card",
        keywords: ["카드번호", "본인가족구분", "승인번호"],
        mapping: { date: "승인일자", amount: "승인금액(원)", merchant: "가맹점명" }
    },
    {
        name: "Hyundai Card",
        keywords: ["승인번호", "가맹점명", "카드종류"],
        mapping: { date: ["이용일자", "승인일"], amount: ["이용금액", "승인금액"], merchant: ["이용가맹점", "가맹점명"] }
    },
    {
        name: "BC Card",
        keywords: ["승인번호", "가맹점명", "접수현황"],
        mapping: { date: ["승인일시", "이용일자", "승인일"], amount: ["승인금액", "이용금액(원)", "이용금액"], merchant: "가맹점명" }
    },
    {
        name: "기업은행",
        keywords: ["거래일시", "출금", "입금", "거래내용", "상대계좌번호"],
        mapping: { date: "거래일시", expense: "출금", income: "입금", merchant: ["기재내용", "거래내용"] }
    }
];

function testFile(file) {
    console.log(`\n--- [${file}] ---`);
    const filePath = path.join('./docs/bank_samples/', file);
    try {
        const workbook = XLSX.readFile(filePath);
        let identified = false;

        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (rows.length === 0) return;

            let profile = null;
            let headerIdx = -1;
            for (let i = 0; i < Math.min(rows.length, 30); i++) {
                const rowStr = (rows[i] || []).map(c => String(c || '').replace(/\s/g, '').normalize('NFC').toLowerCase()).join(' ');
                profile = profiles.find(p => p.keywords.every(k => rowStr.includes(k.replace(/\s/g, '').normalize('NFC').toLowerCase())));
                if (profile) {
                    headerIdx = i;
                    break;
                }
            }

            if (profile) {
                console.log(`✅ Identified as ${profile.name} (Sheet: ${sheetName}) at row ${headerIdx}`);
                identified = true;
                const headers = (rows[headerIdx] || []).map(c => String(c || '').replace(/\s/g, ''));
                const colMap = {};
                for (const [key, mapping] of Object.entries(profile.mapping || {})) {
                    const keys = Array.isArray(mapping) ? mapping : [mapping];
                    const cleanKeys = keys.map(k => k.replace(/\s/g, ''));
                    colMap[key] = headers.findIndex(h => cleanKeys.some(k => h && h.includes(k)));
                }

                const dataRows = rows.slice(headerIdx + 1).filter(r => r && r.length > 3).slice(0, 3);
                dataRows.forEach((row, idx) => {
                    const date = parseDate(row[colMap.date]);
                    let amount = 0;
                    if (colMap.amount !== undefined && colMap.amount !== -1) {
                        amount = parseAmount(row[colMap.amount]);
                    } else if (colMap.expense !== undefined || colMap.income !== undefined) {
                        const out = parseAmount(row[colMap.expense]);
                        const inc = parseAmount(row[colMap.income]);
                        amount = inc || -out;
                    }
                    const merchant = colMap.merchant !== undefined ? (row[colMap.merchant] || 'Unknown') : 'N/A';
                    
                    console.log(`   [Row ${idx+1}] Date: ${date}, Amount: ${amount}, Desc: ${String(merchant).substring(0, 30)}`);
                });
            }
        });
        if (!identified) console.log(`❌ Failed identification`);
    } catch (e) {
        console.error(`💥 Error: ${e.message}`);
    }
}

const files = fs.readdirSync('./docs/bank_samples/').filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
files.forEach(testFile);
