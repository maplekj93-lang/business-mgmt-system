import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { parseExcel } from './src/features/ledger-import/model/parser';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function dumpKakaoData() {
  const { data: txs } = await supabase
      .from("transactions")
      .select("*")
      .ilike("description", "%카카오%")
      .not("description", "ilike", "%뱅크%")
      .is("breakdown_source_id", null);

  const filePath = path.join(__dirname, 'bank_samples', '카카오페이머니_거래내역확인서_20260311172736 복사본.xlsx');
  const buffer = fs.readFileSync(filePath);
  const file = {
      name: '카카오페이머니_거래내역확인서.xlsx',
      arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  } as any;
  
  const parseResult = await parseExcel(file);
  const kakaoRows = parseResult.transactions.map(t => ({
      date: t.date.split('T')[0].replace(/-/g, '.'),
      time: t.date.split('T')[1] || '',
      type: (t.source_raw_data as any)?.raw_type || '', // parser에서 저장한 원본 유형
      amount: Math.abs(t.amount),
      merchant: t.description,
      currency: 'KRW'
  }));

  fs.writeFileSync('dump_txs.json', JSON.stringify(txs, null, 2));
  fs.writeFileSync('dump_kakaoRows.json', JSON.stringify(kakaoRows, null, 2));
  console.log("Dump written to dump_txs.json and dump_kakaoRows.json");
}

dumpKakaoData();
