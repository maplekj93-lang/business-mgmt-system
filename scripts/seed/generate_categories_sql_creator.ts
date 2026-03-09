import fs from 'fs';

const categoriesData = {
    "Expense": {
        "🏠 주거비": ["전세이자", "관리비", "수도요금", "도시가스", "전기요금"],
        "🛍️ 물품구입비": ["생활필수품", "운동용품", "세탁비", "가전 / 가구", "기타물품", "수리비"],
        "🍽️ 식비": ["식자재", "외식", "디저트 / 간식", "배달", "편의점", "코스트코"],
        "☕️ 커피": ["커피"],
        "🚌 교통비": ["대중교통", "택시비", "기차 / 버스", "차량관리비", "과태료", "차량렌탈", "주유비", "주차비", "통행료 / 톨비"],
        "💰 보험료": ["실비보험", "자동차보험", "건강보험", "생명보험", "여행자보험", "국민연금"],
        "🩺 건강": ["병원비", "약제비", "건강식품", "기타건강비"],
        "🎬 문화생활": ["영화", "도서", "학원 / 수강", "전시", "운동"],
        "💻 구독 / 서비스": ["넷플릭스", "애플", "Chat GPT", "어도비", "구글", "유튜브 프리미엄", "디즈니플러스", "ENVATO", "쿠팡", "기타"],
        "📞 통신비": ["쾅 통신요금", "인터넷", "영 통신요금", "우편료"],
        "👩\u200d💻 사업비": ["장비", "식비", "출장비", "진행비", "인건비", "사업 관련 세금"],
        "💛 기부금": ["헌금", "십일조", "공간", "정기후원"],
        "세금": ["지방세", "자동차세", "관세", "과태료", "재산세", "양도세", "증여세", "기타세금"],
        "🎁 경조 / 선물": ["가족 / 친척", "교회", "지인 / 친구", "모임 회비"],
        "💰 저축": ["청약"],
        "💇\u200d♀️ 꾸밈비": ["뷰티 / 화장품", "쾅 의류 / 잡화", "세탁수선비", "미용 / 헤어", "영 의류 / 잡화"],
        "✈️ 여행": ["식비", "이동수단", "기념품 / 쇼핑", "서비스 / 데이터", "숙박비", "관광 / 입장료", "항공비", "그외"],
        "⚠️ 기타비용": ["기타", "지급수수료"]
    },
    "Income": {
        "💼 사업소득": ["쾅 사업소득", "영 사업소득", "블로그", "쾅영 사업소득"],
        "💵 금융소득": ["이자소득"]
    }
};

let sql = `
DO $$
DECLARE
  v_user_id uuid;
  v_parent_id integer;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  -- Delete ALL existing categories first to make a completely fresh start
  DELETE FROM public.mdt_categories;

  -- Reset sequence just in case
  ALTER SEQUENCE public.mdt_categories_id_seq RESTART WITH 1;

`;

// Iterate over types
for (const [typeKey, mainCatObj] of Object.entries(categoriesData)) {
    const dbType = typeKey.toLowerCase();
    for (const [mainName, subArray] of Object.entries(mainCatObj)) {
        // Remove emoji nicely if needed, or keep. Let's keep exactly as string for matched names!
        const safeMainName = mainName.replace(/'/g, "''");
        sql += `
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '${safeMainName}', '${dbType}', NULL) RETURNING id INTO v_parent_id;
`;
        for (const subName of subArray) {
            const safeSubName = subName.replace(/'/g, "''");
            sql += `  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '${safeSubName}', '${dbType}', v_parent_id);\n`;
        }
    }
}

sql += `END $$;`;
fs.writeFileSync('/Users/kwang/Desktop/business-mgmt-system/generate_categories_sql.ts', sql);
console.log("SQL Written to file!");
