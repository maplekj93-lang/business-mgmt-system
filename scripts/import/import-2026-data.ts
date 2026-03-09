import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const samplesDir = path.resolve(process.cwd(), 'docs', 'bank_samples');
const files = fs.readdirSync(samplesDir).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'))
    .filter(f => !f.includes('2025')); // Ignore the 2025 ledger

const ASSETS = [
    { id: 'a717d928-7728-45a1-bb01-9ddcd783451e', name: '광준 / 사업자 삼성카드', ownerType: 'kwangjun' },
    { id: 'eed7f701-de1c-43e1-9db1-bb444f13f9fb', name: '광준 / 개인계좌 / 기업은행', ownerType: 'kwangjun' },
    { id: 'b9e96c50-5be6-4feb-8f7f-17a8c1db7b8a', name: '광준 / 사업자 계좌 / 기업은행', ownerType: 'kwangjun' },
    { id: '36dc3076-ca17-4210-b27f-6c31a720bba2', name: '학자금 광준 / 사업자 / 기업은행', ownerType: 'kwangjun' },
    { id: '5f182906-380e-417b-8180-fed72e6721f7', name: '광준 / 기업은행카드', ownerType: 'kwangjun' },
    { id: '2fd5c929-b9cb-4bfc-842d-3529e984076c', name: '미담헤어', ownerType: 'euiyoung' },
    { id: '169a32c2-e27e-4839-b980-9d03b9317cdd', name: '광영부부 입출금 / 기업은행', ownerType: 'joint' },
    { id: 'd07e9251-2139-4e03-89bc-e0d773143e21', name: '광영 생활비 / 국민은행', ownerType: 'joint' },
    { id: '43abe80c-7a34-4412-8e72-bd1c91ff9f2d', name: '경조사 / 카카오뱅크', ownerType: 'joint' },
    { id: '615ae5ef-253d-4af6-84b5-03470439909b', name: '현금/기타', ownerType: 'joint' },
    { id: '7ddd455c-3272-4b05-b261-5e71a7af4965', name: '쾅영 / 현대카드', ownerType: 'joint' },
    { id: 'c3f01c6b-aa6d-4f7e-a28f-ad6061967ada', name: '수입 / 우리은행', ownerType: 'euiyoung' },
    { id: '3855c1b9-549a-4e40-8735-a58639b2fbbf', name: '청년 주택드림 청약통장 / 우리은행', ownerType: 'euiyoung' },
    { id: 'c37da565-8429-4505-b178-57c4778ead1e', name: '세이프박스 / 카카오뱅크', ownerType: 'euiyoung' },
    { id: '95e40c8c-3d4f-41c7-9fac-c948c59a5364', name: 'KB 주식', ownerType: 'euiyoung' },
    { id: 'd2f8a401-949d-47b0-aa6a-31a422ddc1c0', name: 'KB 예수금', ownerType: 'euiyoung' },
    { id: 'bd47d07b-92e6-4a7a-adda-3efd14f00393', name: '의영 개인 / 기업은행', ownerType: 'euiyoung' },
    { id: '47b6d489-f490-4035-b7bf-020765c500cc', name: '의영 / 삼성카드', ownerType: 'euiyoung' }
];

function getAssetId(keyword: string): string | null {
    const matched = ASSETS.find(a => a.name.includes(keyword) || keyword.includes(a.name));
    return matched ? matched.id : null;
}

function formatAmount(amtStr: any): number {
    if (!amtStr) return 0;
    if (typeof amtStr === 'number') return amtStr;
    const cleaned = amtStr.toString().replace(/,/g, '').trim();
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed;
}

function parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    let d = String(dateStr).replace(/[-./\s년월일:]/g, '');
    if (d.length >= 8) {
        const y = parseInt(d.substring(0, 4));
        const m = parseInt(d.substring(4, 6)) - 1;
        const day = parseInt(d.substring(6, 8));
        return new Date(y, m, day, 12, 0, 0);
    }
    return null;
}

function toLocalYYYYMMDD(d: Date | string | null): string {
    if (!d) return '';
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return '';
    const tzOffset = dateObj.getTimezoneOffset() * 60000;
    return (new Date(dateObj.getTime() - tzOffset)).toISOString().slice(0, 10);
}

const records: any[] = [];
const USER_ID = '7b5b7208-f4cf-4103-8b39-fe6285357634';
const BATCH_ID = uuidv4();

function insertQuery(assetId: string | null, dateStr: string, amount: number, desc: string, raw: any, owner: string) {
    const id = uuidv4();
    records.push({
        id,
        user_id: USER_ID,
        asset_id: assetId,
        import_batch_id: BATCH_ID,
        date: dateStr,
        amount,
        description: desc,
        source_raw_data: raw,
        owner,
        allocation_status: 'personal'
    });
}

for (const file of files) {
    const filePath = path.join(samplesDir, file);
    const workbook = XLSX.readFile(filePath);

    let headerRowIdx = -1;
    let dateCol = -1;
    let descCol = -1;
    let withdrCol = -1;
    let depCol = -1;
    let amountCol = -1;
    let rows: any[][] = [];

    // Find the right sheet
    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const tempRows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

        for (let i = 0; i < Math.min(tempRows.length, 30); i++) {
            const r = tempRows[i];
            if (!r) continue;
            // Use Array.from to handle sparse arrays
            const strHeaders = Array.from(r).map(h => String(h || '').replace(/\s+/g, ''));

            if (strHeaders.includes('이용일자') && strHeaders.includes('이용금액') && strHeaders.includes('가맹점명')) {
                headerRowIdx = i; dateCol = strHeaders.indexOf('이용일자'); amountCol = strHeaders.indexOf('이용금액'); descCol = strHeaders.indexOf('가맹점명'); break;
            } else if (strHeaders.some(h => h?.includes('승인일자')) && strHeaders.some(h => h?.includes('승인금액')) && strHeaders.some(h => h?.includes('가맹점명'))) {
                headerRowIdx = i; dateCol = strHeaders.findIndex(h => h?.includes('승인일자')); amountCol = strHeaders.findIndex(h => h?.includes('승인금액')); descCol = strHeaders.findIndex(h => h?.includes('가맹점명')); break;
            } else if (strHeaders.some(h => h?.includes('승인일')) && strHeaders.some(h => h?.includes('승인금액')) && strHeaders.some(h => h?.includes('가맹점명'))) {
                headerRowIdx = i; dateCol = strHeaders.findIndex(h => h?.includes('승인일')); amountCol = strHeaders.findIndex(h => h?.includes('승인금액')); descCol = strHeaders.findIndex(h => h?.includes('가맹점명')); break;
            } else if (strHeaders.some(h => h?.includes('이용일시')) && strHeaders.some(h => h?.includes('이용금액')) && strHeaders.some(h => h?.includes('가맹점명'))) {
                headerRowIdx = i; dateCol = strHeaders.findIndex(h => h?.includes('이용일시')); amountCol = strHeaders.findIndex(h => h?.includes('이용금액')); descCol = strHeaders.findIndex(h => h?.includes('가맹점명')); break;
            } else if (strHeaders.some(h => h?.includes('거래일시')) && (strHeaders.some(h => h?.includes('출금')) || strHeaders.some(h => h?.includes('거래금액')))) {
                headerRowIdx = i; dateCol = strHeaders.findIndex(h => h?.includes('거래일시')); descCol = strHeaders.findIndex(h => h === '기재내용' || h === '거래내용' || h?.includes('적요') || h?.includes('거래명')); withdrCol = strHeaders.findIndex(h => h?.includes('출금') || h === '찾으신금액'); depCol = strHeaders.findIndex(h => h?.includes('입금') || h === '맡기신금액'); if (withdrCol === -1) amountCol = strHeaders.findIndex(h => h?.includes('거래금액')); break;
            }
        }

        if (headerRowIdx !== -1) {
            rows = tempRows;
            break;
        }
    }

    if (headerRowIdx === -1) {
        console.log(`Warning: Header row not found in ${file}`);
        continue;
    }

    const rawHeaderArr = Array.from(rows[headerRowIdx]);
    const header = rawHeaderArr.map(h => String(h || '').replace(/\s+/g, ''));

    for (let i = headerRowIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length === 0 || !r[dateCol]) continue;

        const dateStrRaw = String(r[dateCol]).trim();
        if (!dateStrRaw || dateStrRaw === '합계' || dateStrRaw.includes('소계') || dateStrRaw.length < 8) continue;

        let rowDate = parseDate(dateStrRaw);
        if (!rowDate) continue;

        let amount = 0;
        if (withdrCol !== -1 && depCol !== -1) {
            let withdrawal = formatAmount(r[withdrCol]);
            let deposit = formatAmount(r[depCol]);
            if (withdrawal > 0) amount = -withdrawal;
            else if (deposit > 0) amount = deposit;
        } else if (amountCol !== -1) {
            amount = -formatAmount(r[amountCol]);
        }

        if (amount === 0) continue;

        let desc = descCol !== -1 && r[descCol] ? String(r[descCol]).trim() : '';

        const rawObj: Record<string, any> = {};
        for (let c = 0; c < header.length; c++) {
            if (header[c]) {
                const val = r[c] ?? '';
                rawObj[header[c]] = typeof val === 'number' ? val.toString() : val;
            }
        }
        rawObj['_source_file'] = file;
        rawObj['import_type'] = '2026_AUTO_IMPORT';

        // OWNER DETERMINATION LOGIC
        let owner = '미상';
        let assetId = null;
        const normalizedFile = file.normalize('NFC');

        if (normalizedFile.includes('1월2월삼성카드')) {
            owner = '광준';
            assetId = getAssetId('사업자 삼성카드');
        } else if (normalizedFile.includes('Approve')) {
            const cardNumCol = header.findIndex(h => h.includes('카드번호') || h.includes('이용카드'));
            const cardNum = cardNumCol !== -1 ? String(r[cardNumCol]) : '';
            if (cardNum.includes('A429')) {
                owner = '광준';
                assetId = getAssetId('기업은행카드');
            } else if (cardNum.includes('A010')) {
                owner = '의영';
                assetId = getAssetId('의영 개인 / 기업은행');
                rawObj['_note'] = '가족카드';
            }
        } else if (normalizedFile.includes('hyundaicard')) {
            const cardTypeCol = header.findIndex(h => h.includes('카드구분') || h.includes('사용자'));
            const cardType = cardTypeCol !== -1 ? String(r[cardTypeCol]) : '';
            if (cardType.includes('가족')) {
                owner = '광준';
            } else {
                owner = '의영';
            }
            assetId = getAssetId('현대카드');
        } else if (normalizedFile.includes('거래내역조회')) {
            const accNumCol = header.findIndex(h => h === '계좌번호');
            const accNum = accNumCol !== -1 ? String(r[accNumCol]).replace(/-/g, '') : '';
            if (!accNum) {
                let topAccNum = '';
                for (let j = 0; j < headerRowIdx; j++) {
                    let rowStr = Array.from(rows[j]).join('');
                    let match = rowStr.match(/([0-9-]{10,})/);
                    if (match) topAccNum = match[1].replace(/-/g, '');
                }
                if (topAccNum.startsWith('048')) {
                    owner = '광준';
                    assetId = getAssetId('사업자 계좌 / 기업은행');
                } else if (topAccNum.startsWith('158')) {
                    owner = '광준';
                    assetId = getAssetId('개인계좌 / 기업은행');
                }
            } else {
                if (accNum.startsWith('048')) {
                    owner = '광준';
                    assetId = getAssetId('사업자 계좌 / 기업은행');
                } else if (accNum.startsWith('158')) {
                    owner = '광준';
                    assetId = getAssetId('개인계좌 / 기업은행');
                }
            }
        } else if (normalizedFile.includes('카카오뱅크')) {
            let name = '카카오뱅크';
            for (let j = 0; j < headerRowIdx; j++) {
                let rowStr = Array.from(rows[j]).join('');
                if (rowStr.includes('성명')) {
                    const match = rowStr.match(/성명([^A-Za-z0-9]+)/);
                    if (match) name = match[1].replace(/[:\s]/g, '');
                }
            }
            if (name.includes('의영')) { owner = '의영'; assetId = getAssetId('세이프박스'); }
            else if (name.includes('광준')) owner = '광준';
            else owner = '의영';
        }

        const formattedDate = toLocalYYYYMMDD(rowDate);
        if (!formattedDate) continue;
        insertQuery(assetId, formattedDate, amount, desc, rawObj, owner);
    }
}

fs.writeFileSync(path.resolve(process.cwd(), 'scripts', 'import_2026_data.json'), JSON.stringify(records, null, 2));
console.log(`Generated import_2026_data.json with ${records.length} records.`);
