import * as XLSX from 'xlsx';
import * as fs from 'fs';

async function generateSQL() {
    const userId = '7b5b7208-f4cf-4103-8b39-fe6285357634';
    const filePath = '/Users/kwang/Downloads/가계부관련/2025 쾅영부부 가계부 - 가계부 기록.csv';

    const content = fs.readFileSync(filePath, 'utf8');
    const workbook = XLSX.read(content, { type: 'string' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Read as array of arrays, skipping the first 7 lines (header is at line 7)
    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 7 });

    let sql = "DELETE FROM public.transactions;\n\n";
    let count = 0;

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 7) continue;

        // ,날짜,구분,대분류,소분류,내용,금액,입금계좌,출금계좌
        // Indices (assuming first col is index 0 if CSV starts with comma, but XLSX might treat it differently)
        // Let's assume indices from previous debug:
        // 1: 날짜, 2: 구분, 3: 대분류, 4: 소분류, 5: 내용, 6: 금액, 7: 입금계좌, 8: 출금계좌

        const dateRaw = row[1];
        const typeStr = row[2];
        const catNameString = row[4] ? String(row[4]).trim() : '';
        const desc = (row[5] ? String(row[5]).trim() : '').replace(/'/g, "''");
        const amountRaw = String(row[6] || '0');
        const bankName = String(row[8] || row[7] || '').trim();

        if (!dateRaw || amountRaw === '0') continue;

        let date = "";
        if (typeof dateRaw === 'number') {
            const dateObj = new Date((dateRaw - 25569) * 86400 * 1000);
            date = dateObj.toISOString().split('T')[0];
        } else {
            // "2025/01/01" -> "2025-01-01"
            date = String(dateRaw).replace(/\//g, '-');
        }

        let amount = parseInt(amountRaw.replace(/[^0-9\-]/g, ''), 10);
        if (isNaN(amount)) continue;

        if (typeStr === '지출') amount = -Math.abs(amount);
        else if (typeStr === '수입') amount = Math.abs(amount);

        // 자산 매핑 고도화
        const normalizedBank = bankName.replace(/\s/g, '').replace(/쾅/g, '광');

        let assetSubquery = "NULL";
        if (bankName) {
            // DB의 assets 테이블 name 컬럼도 동일하게 정규화하여 비교
            // 추가로 '광영' -> '의영' (사용자 요청: 쾅영은 의영으로) 처리는 DB의 assets 테이블 데이터 자체가 이미 의영/uiyoung으로 되어 있을 것이므로 매핑만 잘 되면 됨.
            assetSubquery = `(SELECT id FROM assets WHERE REPLACE(REPLACE(name, ' ', ''), '쾅', '광') = '${normalizedBank.replace(/'/g, "''")}' LIMIT 1)`;
        } else {
            assetSubquery = `(SELECT id FROM assets WHERE name = '현금/기타' LIMIT 1)`;
        }

        const catSubquery = `(SELECT id FROM mdt_categories WHERE name = '${catNameString.replace(/'/g, "''")}' LIMIT 1)`;

        const rawData = JSON.stringify({ _bank: bankName, _cat: catNameString, _type: typeStr }).replace(/'/g, "''");

        sql += `INSERT INTO public.transactions (user_id, date, amount, description, category_id, asset_id, allocation_status, source_raw_data) VALUES ('${userId}', '${date}', ${amount}, '${desc}', ${catSubquery}, ${assetSubquery}, 'personal', '${rawData}');\n`;
        count++;
    }

    fs.writeFileSync('/tmp/seed_txs.sql', sql);

    console.log(`✅ SQL generated with ${count} rows at /tmp/seed_txs.sql`);
}

generateSQL();
