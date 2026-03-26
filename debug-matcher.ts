import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { parseExcel } from './src/features/ledger-import/model/parser';
import { matchKakaoTransactions } from './src/features/kakao-pay-matcher/model/matcher';

// Initialize Supabase (Using standard anonymous key for test script read)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugKakaoMatch() {
  console.log("1. Starting Debug Script...");
  
  // 1. Fetch from DB exactly as Widget does
  console.log("2. Fetching DB Transactions...");
  const { data: txs, error } = await supabase
      .from("transactions")
      .select("*")
      .ilike("description", "%카카오%")
      .not("description", "ilike", "%뱅크%")
      .is("breakdown_source_id", null);
      
  if (error) {
     console.error("DB Fetch Error:", error);
     return;
  }
  console.log(`-> DB fetched ${txs?.length} matching rows`);

  // 2. Parse the specific Excel File
  const filePath = path.join(__dirname, 'bank_samples', '카카오페이머니_거래내역확인서_20260311172736 복사본.xlsx');
  console.log(`3. Reading Excel from ${filePath}...`);
  if (!fs.existsSync(filePath)) {
      console.error("File not found!");
      return;
  }
  
  // We need to polyfill File for Node environment to use parseExcel
  const buffer = fs.readFileSync(filePath);
  const file = {
      name: '카카오페이머니_거래내역확인서.xlsx',
      arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  } as any;
  
  const parseResult = await parseExcel(file);
  console.log(`-> Excel Parsed. Stats:`, parseResult.stats);
  
  // 3. Convert to KakaoRows exactly as Widget does
  const kakaoRows = parseResult.transactions.map(t => ({
      date: t.date.split('T')[0].replace(/-/g, '.'),
      time: t.date.split('T')[1] || '',
      type: (t.source_raw_data as any)?.raw_type || '',
      amount: Math.abs(t.amount),
      merchant: t.description,
      currency: 'KRW'
  }));
  
  console.log(`-> Total Kakao Rows available for match: ${kakaoRows.length}`);
  
  // 4. Run Matcher
  const matches = await matchKakaoTransactions(txs || [], kakaoRows);
  console.log(`-> FINAL MATCHED COUNT: ${matches.length}`);
  
  // 5. Unmatched analysis
  const matchedRowDates = matches.map(m => m.kakaoPayRow.date + m.kakaoPayRow.amount);
  const unmatchedRows = kakaoRows.filter(r => !matchedRowDates.includes(r.date + r.amount));
  
  console.log("\n--- UNMATCHED EXCEL ROWS (Sample 5) ---");
  console.log(unmatchedRows.slice(0, 5));
}

debugKakaoMatch();
