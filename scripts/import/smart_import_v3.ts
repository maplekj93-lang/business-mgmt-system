
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const USER_ID = '7b5b7208-f4cf-4103-8b39-fe6285357634';

const CATEGORIES = [
    { id: 1, name: '🏠 주거비', type: 'expense' },
    { id: 4, name: '🛍️ 물품구입비', type: 'expense' },
    { id: 11, name: '🍽️ 식비', type: 'expense' },
    { id: 18, name: '☕️ 커피', type: 'expense' },
    { id: 20, name: '🚌 교통비', type: 'expense' },
    { id: 30, name: '💰 보험료', type: 'expense' },
    { id: 37, name: '🩺 건강', type: 'expense' },
    { id: 42, name: '🎬 문화생활', type: 'expense' },
    { id: 48, name: '💻 구독 / 서비스', type: 'expense' },
    { id: 59, name: '📞 통신비', type: 'expense' },
    { id: 64, name: '👩‍💻 사업비', type: 'expense' },
    { id: 71, name: '💛 기부금', type: 'expense' },
    { id: 76, name: '세금', type: 'expense' },
    { id: 85, name: '🎁 경조 / 선물', type: 'expense' },
    { id: 90, name: '💰 저축', type: 'expense' },
    { id: 93, name: '💇‍♀️ 꾸밈비', type: 'expense' },
    { id: 99, name: '✈️ 여행', type: 'expense' },
    { id: 108, name: '⚠️ 기타비용', type: 'expense' },
    { id: 111, name: '💼 사업소득', type: 'income' },
    { id: 116, name: '💵 금융소득', type: 'income' }
];

const ASSETS = [
    { id: 'bd47d07b-92e6-4a7a-adda-3efd14f00393', name: '의영 개인 / 기업은행', owner: '의영' },
    { id: '47b6d489-f490-4035-b7bf-020765c500cc', name: '의영 / 삼성카드', owner: '의영' },
    { id: '7ddd455c-3272-4b05-b261-5e71a7af4965', name: '쾅영 / 현대카드', owner: '공용' },
    { id: '2fd5c929-b9cb-4bfc-842d-3529e984076c', name: '미담헤어', owner: '사업자' },
    { id: '169a32c2-e27e-4839-b980-9d03b9317cdd', name: '광영부부 입출금 / 기업은행', owner: '공용' },
    { id: 'd07e9251-2139-4e03-89bc-e0d773143e21', name: '광영 생활비 / 국민은행', owner: '공용' },
    { id: '43abe80c-7a34-4412-8e72-bd1c91ff9f2d', name: '경조사 / 카카오뱅크', owner: '공용' },
    { id: 'c3f01c6b-aa6d-4f7e-a28f-ad6061967ada', name: '수입 / 우리은행', owner: '광준' },
    { id: '3855c1b9-549a-4e40-8735-a58639b2fbbf', name: '청년 주택드림 청약통장 / 우리은행', owner: '광준' },
    { id: 'c37da565-8429-4505-b178-57c4778ead1e', name: '세이프박스 / 카카오뱅크', owner: '광준' },
    { id: '95e40c8c-3d4f-41c7-9fac-c948c59a5364', name: 'KB 주식', owner: '광준' },
    { id: 'd2f8a401-949d-47b0-aa6a-31a422ddc1c0', name: 'KB 예수금', owner: '광준' },
    { id: 'a717d928-7728-45a1-bb01-9ddcd783451e', name: '광준 / 사업자 삼성카드', owner: '광준' },
    { id: 'eed7f701-de1c-43e1-9db1-bb444f13f9fb', name: '광준 / 개인계좌 / 기업은행', owner: '광준' },
    { id: 'b9e96c50-5be6-4feb-8f7f-17a8c1db7b8a', name: '광준 / 사업자 계좌 / 기업은행', owner: '광준' },
    { id: '36dc3076-ca17-4210-b27f-6c31a720bba2', name: '학자금 광준 / 사업자 / 기업은행', owner: '광준' },
    { id: '5f182906-380e-417b-8180-fed72e6721f7', name: '광준 / 기업은행카드', owner: '광준' },
    { id: '615ae5ef-253d-4af6-84b5-03470439909b', name: '현금/기타', owner: '기타' }
];

const normalize = (s: string) => s.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

async function run() {
    console.log('🚀 Starting SQL Generation V3 (Nellna Style)');

    const categoryMap = new Map();
    CATEGORIES.forEach(c => {
        categoryMap.set(normalize(c.name), c.id);
    });

    const assetMap = new Map();
    ASSETS.forEach(a => {
        const key = a.name.trim();
        assetMap.set(key, a.id);
        if (key.includes('광영')) assetMap.set(key.replace('광영', '쾅영'), a.id);
        if (key.includes('쾅영')) assetMap.set(key.replace('쾅영', '광영'), a.id);
    });

    const workbook = XLSX.readFile('2025 쾅영부부 가계부 (2).xlsx');
    const sheet = workbook.Sheets['가계부 기록'];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    const sqlLines = [
        'BEGIN;',
        'TRUNCATE TABLE public.transactions CASCADE;',
        'INSERT INTO public.transactions (user_id, category_id, asset_id, allocation_status, amount, date, transaction_time, description, source_raw_data) VALUES'
    ];

    const values: string[] = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 6 || !row[0]) continue;

        const dateSerial = row[0];
        const typeStr = row[1];
        const mainCat = row[2] ? normalize(String(row[2])) : '';
        const subCat = row[3] ? normalize(String(row[3])) : '';
        const description = String(row[4] || '').replace(/'/g, "''");
        const amount = parseFloat(String(row[5]).replace(/,/g, ''));
        const assetName = String(row[7] || '').trim();

        if (isNaN(amount) || amount === 0) continue;

        // Date & Time Logic
        const dateObj = new Date((dateSerial - 25569) * 86400 * 1000);
        const date = dateObj.toISOString().split('T')[0];

        // If year is 2026, we might want to check for time (though excel might not have it in this specific file yet)
        // User said: "2025 data don't need time".
        const transactionTime = 'NULL';

        const categoryId = categoryMap.get(subCat) || categoryMap.get(mainCat) || 'NULL';
        const assetId = assetMap.get(assetName) || assetMap.get('현금/기타') || 'NULL';
        const finalAmount = typeStr === '지출' ? -Math.abs(amount) : Math.abs(amount);

        const sourceRaw = JSON.stringify({
            import_type: 'NELLNA_V3',
            excel_row: i + 1,
            original_asset: assetName,
            original_category: `${mainCat} > ${subCat}`
        }).replace(/'/g, "''");

        const assetIdStr = assetId === 'NULL' ? 'NULL' : `'${assetId}'`;

        values.push(`('${USER_ID}', ${categoryId}, ${assetIdStr}, 'personal', ${finalAmount}, '${date}', ${transactionTime}, '${description}', '${sourceRaw}'::jsonb)`);
    }

    const finalSql = sqlLines.join('\n') + '\n' + values.join(',\n') + ';\nCOMMIT;';

    fs.writeFileSync('2026_import_v3.sql', finalSql);
    console.log(`✨ Generated SQL with ${values.length} transactions at 2026_import_v3.sql`);
}

run();
