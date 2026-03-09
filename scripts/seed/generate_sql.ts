import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Use service role if possible, but assuming user has RLS for anon if we pass their auth or just do it via MCP SQL.
// Actually, using MCP SQL might be easier, but let's just generate the SQL directly in the script to copy-paste or execute via MCP.

const records = [
    // 1. 자산 / 현금·예금 / 보통예금 / 의영 개인 / 기업은행 -> 자산
    { name: '의영 개인 / 기업은행', owner_type: 'personal', asset_type: 'bank', keywords: '{"의영 개인 / 기업은행"}' },
    // 2. 자산 / 현금·예금 / 보통예금 / 광영부부 입출금 / 기업은행 -> 자산
    { name: '광영부부 입출금 / 기업은행', owner_type: 'joint', asset_type: 'bank', keywords: '{"광영부부 입출금 / 기업은행"}' },
    // 3. 자산 / 현금·예금 / 보통예금 / 광영 생활비 / 국민은행 -> 자산
    { name: '광영 생활비 / 국민은행', owner_type: 'joint', asset_type: 'bank', keywords: '{"광영 생활비 / 국민은행"}' },
    // 4. 자산 / 현금·예금 / 보통예금 / 수입 / 우리은행 -> 자산
    { name: '수입 / 우리은행', owner_type: 'personal', asset_type: 'bank', keywords: '{"수입 / 우리은행"}' },
    // 5. 자산 / 저축·투자 / 예적금 / 청년 주택드림 청약통장 / 우리은행 -> 자산
    { name: '청년 주택드림 청약통장 / 우리은행', owner_type: 'personal', asset_type: 'bank', keywords: '{"청년 주택드림 청약통장 / 우리은행"}' },
    // 6. 자산 / 저축·투자 / 예적금 / 세이프박스 / 카카오뱅크 -> 자산
    { name: '세이프박스 / 카카오뱅크', owner_type: 'personal', asset_type: 'bank', keywords: '{"세이프박스 / 카카오뱅크"}' },
    // 7. 자산 / 저축·투자 / 예적금 / 경조사 / 카카오뱅크 -> 자산
    { name: '경조사 / 카카오뱅크', owner_type: 'joint', asset_type: 'bank', keywords: '{"경조사 / 카카오뱅크", "경조사 / 카카오뱅크 "}' },
    // 8. 자산 / 저축·투자 / 주식 / KB 주식 -> 자산
    { name: 'KB 주식', owner_type: 'personal', asset_type: 'investment', keywords: '{"KB 주식"}' },
    // 9. 자산 / 현금·예금 / CMA / KB 예수금 -> 자산
    { name: 'KB 예수금', owner_type: 'personal', asset_type: 'bank', keywords: '{"KB 예수금"}' },
    // 10. 부채 / 신용카드 / 할부 / 의영 / 삼성카드 -> 부채
    { name: '의영 / 삼성카드', owner_type: 'personal', asset_type: 'card', keywords: '{"의영 / 삼성카드"}' },
    // 11. 부채 / 신용카드 / 할부 / 광준 / 사업자 삼성카드 -> 부채
    { name: '광준 / 사업자 삼성카드', owner_type: 'business', asset_type: 'card', keywords: '{"광준 / 사업자 삼성카드"}' },
    // 12. 자산 / 현금·예금 / 보통예금 / 광준 / 개인계좌 / 기업은행 -> 자산
    { name: '광준 / 개인계좌 / 기업은행', owner_type: 'personal', asset_type: 'bank', keywords: '{"광준 / 개인계좌 / 기업은행"}' },
    // 13. 자산 / 현금·예금 / 현금 / 광준 / 사업자 계좌 / 기업은행 -> 자산
    { name: '광준 / 사업자 계좌 / 기업은행', owner_type: 'business', asset_type: 'cash', keywords: '{"광준 / 사업자 계좌 / 기업은행"}' },
    // 14. 부채 / 신용카드 / 일시불 / 쾅영 / 현대카드 -> 부채 (We can just use one name for this, but Excel separates ilsi/halbu)
    { name: '쾅영 / 현대카드', owner_type: 'joint', asset_type: 'card', keywords: '{"쾅영 / 현대카드"}' },
    // 16. 자산 / 기타자산 / 선급비용 / 미담헤어 -> 자산
    { name: '미담헤어', owner_type: 'personal', asset_type: 'other', keywords: '{"미담헤어"}' },
    // 17. 부채 / 장기부채 / 학자금대출 / 학자금 광준 / 사업자 / 기업은행 -> 부채
    { name: '학자금 광준 / 사업자 / 기업은행', owner_type: 'personal', asset_type: 'loan', keywords: '{"학자금 광준 / 사업자 / 기업은행"}' },
    // 18. 부채 / 신용카드 / 할부 / 광준 / 기업은행카드 -> 부채
    { name: '광준 / 기업은행카드', owner_type: 'personal', asset_type: 'card', keywords: '{"광준 / 기업은행카드"}' }
];

// Let's print the SQL to execute
let sql = `
-- USER ID fetching
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM public.users LIMIT 1;  -- Grab the primary user

  -- Delete all existing assets safely to reset
  DELETE FROM public.assets;

  -- Insert all 18 mapped assets
`;

records.forEach(r => {
    sql += `  INSERT INTO public.assets (user_id, name, owner_type, asset_type, identifier_keywords) VALUES (v_user_id, '${r.name}', '${r.owner_type}', '${r.asset_type}', '${r.keywords}');\n`;
});

sql += `END $$;`;
console.log(sql);
