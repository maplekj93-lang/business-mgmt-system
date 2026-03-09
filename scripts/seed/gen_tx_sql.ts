import * as XLSX from 'xlsx';
import fs from 'fs';

const filePath = '/Users/kwang/Downloads/가계부관련/2025 쾅영부부 가계부 - 가계부 기록.csv';
let decoded = '';
try {
    const fileBuffer = fs.readFileSync(filePath);
    try {
        decoded = new TextDecoder('utf-8', { fatal: true }).decode(fileBuffer);
    } catch {
        decoded = new TextDecoder('euc-kr').decode(fileBuffer);
    }
} catch (err) {
    console.error("File read error:", err);
    process.exit(1);
}

const workbook = XLSX.read(decoded, { type: 'string' });
const sheetName = workbook.SheetNames[0];
const rows = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets[sheetName], { header: 1 });
for (let x = 4; x < 15; x++) console.log("Row " + x + ":", rows[x]);
const generateSql = async () => {
    let sql = `
DO $$
DECLARE
  v_user_id uuid := '7b5b7208-f4cf-4103-8b39-fe6285357634';
  v_asset_id integer;
  v_category_id integer;
BEGIN
  -- We leave assets and categories alone, just clear transactions
  DELETE FROM public.transactions WHERE id != '00000000-0000-0000-0000-000000000000';

`;

    let txCount = 0;

    for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length < 8) continue;

        let dateValue = r[1] ? r[1] : '';
        const typeStr = r[2] ? String(r[2]).trim() : '';
        const mainCat = r[3] ? String(r[3]).trim() : '';
        const subCat = r[4] ? String(r[4]).trim() : '';
        const memo = r[5] ? String(r[5]).trim() : '';
        const amountStr = r[6] ? String(r[6]).trim() : '';
        const inAcc = r[7] ? String(r[7]).trim() : '';
        const outAcc = r[8] ? String(r[8]).trim() : '';

        if (!dateValue || !amountStr) continue;

        // Clean date: parse if it's an excel numeric date
        let date = '';
        if (typeof dateValue === 'number') {
            date = XLSX.SSF.format('yyyy-mm-dd', dateValue);
        } else {
            date = String(dateValue).trim().replace(/\./g, '-');
        }

        // Clean amount
        let amount = parseInt(amountStr.replace(/[^0-9\-]/g, ''), 10);
        if (isNaN(amount)) continue;

        if (typeStr === '지출') amount = -Math.abs(amount);
        else if (typeStr === '수입') amount = Math.abs(amount);
        else continue;

        let dateSql = date;
        // If length is 10 (yyyy-mm-dd), append time
        if (date.length === 10) dateSql += ' 00:00:00';

        const safeMemo = memo.replace(/'/g, "''");

        const targetAccount = outAcc || inAcc;
        const safeAccount = targetAccount.replace(/'/g, "''");
        const safeSubCat = subCat.replace(/'/g, "''");
        const safeMainCat = mainCat.replace(/'/g, "''");

        sql += `
  v_asset_id := (SELECT id FROM public.assets WHERE name = '${safeAccount}' LIMIT 1);
  v_category_id := (SELECT id FROM public.mdt_categories WHERE name = '${safeSubCat}' AND type = '${typeStr === '수입' ? 'income' : 'expense'}' LIMIT 1);
  IF v_category_id IS NULL THEN
      v_category_id := (SELECT id FROM public.mdt_categories WHERE name = '${safeMainCat}' LIMIT 1);
  END IF;

  INSERT INTO public.transactions (
      user_id, amount, date, description, account_id, category_id, allocation_status, source_raw_data
  ) VALUES (
      v_user_id, ${amount}, '${dateSql}', '${safeMemo}', v_asset_id, v_category_id, 'personal', '{"import_type": "BULK_HARDCODED", "_bank": "${safeAccount}"}'::jsonb
  );
`;
        txCount++;
    }

    sql += `
END $$;
`;
    fs.writeFileSync('/Users/kwang/Desktop/business-mgmt-system/insert_txs_final.sql', sql);
    console.log(`Generated SQL for ${txCount} transactions!`);
};

generateSql();
