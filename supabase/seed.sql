-- Antigravity Seed Script (2025 Standard)
-- Clean Slate
TRUNCATE TABLE mdt_categories, assets_liabilities, mdt_allocation_rules RESTART IDENTITY CASCADE;

-- Variable Store for Hierarchy
DO $$
DECLARE
    p_housing INT;
    p_living INT;
    p_food INT;
    p_coffee INT;
    p_transport INT;
    p_insurance INT;
    p_health INT;
    p_culture INT;
    p_sub INT;
    p_comm INT;
    p_business INT;
    p_donation INT;
    p_tax INT;
    p_gift INT;
    p_saving INT;
    p_beauty INT;
    p_travel INT;
    p_etc INT;
    p_biz_income INT;
    p_fin_income INT;
    p_transfer INT;
    p_lc INT;
    p_dp INT;
BEGIN

-- ==========================================
-- 1. Track A: Personal Life (가계부) - Expenses
-- ==========================================

    -- 🏠 주거비
    INSERT INTO mdt_categories (name, type, ui_config) VALUES ('🏠 주거비', 'expense', '{"color":"blue"}') RETURNING id INTO p_housing;
    INSERT INTO mdt_categories (name, type, parent_id) VALUES 
    ('전세이자', 'expense', p_housing), ('관리비', 'expense', p_housing), ('수도요금', 'expense', p_housing), 
    ('도시가스', 'expense', p_housing), ('전기요금', 'expense', p_housing);

    -- 🛍️ 물품구입비
    INSERT INTO mdt_categories (name, type, ui_config) VALUES ('🛍️ 물품구입비', 'expense', '{"color":"orange"}') RETURNING id INTO p_living;
    INSERT INTO mdt_categories (name, type, parent_id) VALUES 
    ('생활필수품', 'expense', p_living), ('운동용품', 'expense', p_living), ('세탁비', 'expense', p_living), 
    ('가전/가구', 'expense', p_living), ('기타물품', 'expense', p_living), ('수리비', 'expense', p_living);

    -- 🍽️ 식비
    INSERT INTO mdt_categories (name, type, ui_config) VALUES ('🍽️ 식비', 'expense', '{"color":"green"}') RETURNING id INTO p_food;
    INSERT INTO mdt_categories (name, type, parent_id) VALUES 
    ('식자재', 'expense', p_food), ('외식', 'expense', p_food), ('디저트/간식', 'expense', p_food), 
    ('배달', 'expense', p_food), ('편의점', 'expense', p_food), ('코스트코', 'expense', p_food);

    -- ☕️ 커피
    INSERT INTO mdt_categories (name, type, ui_config) VALUES ('☕️ 커피', 'expense', '{"color":"amber"}') RETURNING id INTO p_coffee;
    INSERT INTO mdt_categories (name, type, parent_id) VALUES ('커피', 'expense', p_coffee);

    -- 🚌 교통비
    INSERT INTO mdt_categories (name, type, ui_config) VALUES ('🚌 교통비', 'expense', '{"color":"slate"}') RETURNING id INTO p_transport;
    INSERT INTO mdt_categories (name, type, parent_id) VALUES 
    ('대중교통', 'expense', p_transport), ('택시비', 'expense', p_transport), ('기차/버스', 'expense', p_transport),
    ('차량관리비', 'expense', p_transport), ('과태료', 'expense', p_transport), ('차량렌탈', 'expense', p_transport),
    ('주유비', 'expense', p_transport), ('주차비', 'expense', p_transport), ('통행료/톨비', 'expense', p_transport);

    -- 💰 보험료
    INSERT INTO mdt_categories (name, type, ui_config) VALUES ('💰 보험료', 'expense', '{"color":"red"}') RETURNING id INTO p_insurance;
    INSERT INTO mdt_categories (name, type, parent_id) VALUES 
    ('실비보험', 'expense', p_insurance), ('자동차보험', 'expense', p_insurance), ('건강보험', 'expense', p_insurance),
    ('생명보험', 'expense', p_insurance), ('여행자보험', 'expense', p_insurance), ('국민연금', 'expense', p_insurance);

    -- 🩺 건강
    INSERT INTO mdt_categories (name, type, ui_config) VALUES ('🩺 건강', 'expense', '{"color":"emerald"}') RETURNING id INTO p_health;
    INSERT INTO mdt_categories (name, type, parent_id) VALUES 
    ('병원비', 'expense', p_health), ('약제비', 'expense', p_health), ('건강식품', 'expense', p_health), ('기타건강비', 'expense', p_health);

    -- 🎬 문화생활
    INSERT INTO mdt_categories (name, type, ui_config) VALUES ('🎬 문화생활', 'expense', '{"color":"purple"}') RETURNING id INTO p_culture;
    INSERT INTO mdt_categories (name, type, parent_id) VALUES 
    ('영화', 'expense', p_culture), ('도서', 'expense', p_culture), ('학원/수강', 'expense', p_culture), ('전시', 'expense', p_culture), ('운동', 'expense', p_culture);

    -- 💻 구독/서비스
    INSERT INTO mdt_categories (name, type, ui_config) VALUES ('💻 구독/서비스', 'expense', '{"color":"indigo"}') RETURNING id INTO p_sub;
    INSERT INTO mdt_categories (name, type, parent_id) VALUES 
    ('넷플릭스', 'expense', p_sub), ('애플', 'expense', p_sub), ('Chat GPT', 'expense', p_sub), ('어도비', 'expense', p_sub),
    ('구글', 'expense', p_sub), ('유튜브 프리미엄', 'expense', p_sub), ('디즈니플러스', 'expense', p_sub), ('ENVATO', 'expense', p_sub),
    ('쿠팡', 'expense', p_sub), ('기타', 'expense', p_sub);

    -- 📞 통신비
    INSERT INTO mdt_categories (name, type, ui_config) VALUES ('📞 통신비', 'expense', '{"color":"sky"}') RETURNING id INTO p_comm;
    INSERT INTO mdt_categories (name, type, parent_id) VALUES 
    ('쾅 통신요금', 'expense', p_comm), ('인터넷', 'expense', p_comm), ('영 통신요금', 'expense', p_comm), ('우편료', 'expense', p_comm);

    -- 👩💻 사업비 (가계부 관점)
    INSERT INTO mdt_categories (name, type, ui_config) VALUES ('👩💻 사업비', 'expense', '{"color":"zinc"}') RETURNING id INTO p_business;
    INSERT INTO mdt_categories (name, type, parent_id) VALUES 
    ('장비', 'expense', p_business), ('식비', 'expense', p_business), ('출장비', 'expense', p_business), 
    ('진행비', 'expense', p_business), ('인건비', 'expense', p_business), ('사업 관련 세금', 'expense', p_business);

    -- 💛 기부금
    INSERT INTO mdt_categories (name, type, ui_config) VALUES ('💛 기부금', 'expense', '{"color":"yellow"}') RETURNING id INTO p_donation;
    INSERT INTO mdt_categories (name, type, parent_id) VALUES 
    ('헌금', 'expense', p_donation), ('십일조', 'expense', p_donation), ('공간', 'expense', p_donation), ('정기후원', 'expense', p_donation);

    -- 🏛️ 세금
    INSERT INTO mdt_categories (name, type, ui_config) VALUES ('🏛️ 세금', 'expense', '{"color":"stone"}') RETURNING id INTO p_tax;
    INSERT INTO mdt_categories (name, type, parent_id) VALUES 
    ('지방세', 'expense', p_tax), ('자동차세', 'expense', p_tax), ('관세', 'expense', p_tax), 
    ('과태료', 'expense', p_tax), ('재산세', 'expense', p_tax), ('양도세', 'expense', p_tax), ('증여세', 'expense', p_tax), ('기타세금', 'expense', p_tax);

    -- 🎁 경조/선물
    INSERT INTO mdt_categories (name, type, ui_config) VALUES ('🎁 경조/선물', 'expense', '{"color":"pink"}') RETURNING id INTO p_gift;
    INSERT INTO mdt_categories (name, type, parent_id) VALUES 
    ('가족/친척', 'expense', p_gift), ('교회', 'expense', p_gift), ('지인/친구', 'expense', p_gift), ('모임 회비', 'expense', p_gift);

    -- 💰 저축
    INSERT INTO mdt_categories (name, type, ui_config) VALUES ('💰 저축', 'expense', '{"color":"lime"}') RETURNING id INTO p_saving;
    INSERT INTO mdt_categories (name, type, parent_id) VALUES ('청약', 'expense', p_saving);

    -- 💇♀️ 꾸밈비
    INSERT INTO mdt_categories (name, type, ui_config) VALUES ('💇♀️ 꾸밈비', 'expense', '{"color":"rose"}') RETURNING id INTO p_beauty;
    INSERT INTO mdt_categories (name, type, parent_id) VALUES 
    ('뷰티/화장품', 'expense', p_beauty), ('쾅 의류/잡화', 'expense', p_beauty), ('세탁수선비', 'expense', p_beauty), 
    ('미용/헤어', 'expense', p_beauty), ('영 의류/잡화', 'expense', p_beauty);

    -- ✈️ 여행
    INSERT INTO mdt_categories (name, type, ui_config) VALUES ('✈️ 여행', 'expense', '{"color":"cyan"}') RETURNING id INTO p_travel;
    INSERT INTO mdt_categories (name, type, parent_id) VALUES 
    ('식비', 'expense', p_travel), ('이동수단', 'expense', p_travel), ('기념품/쇼핑', 'expense', p_travel), ('서비스/데이터', 'expense', p_travel),
    ('숙박비', 'expense', p_travel), ('관광/입장료', 'expense', p_travel), ('항공비', 'expense', p_travel), ('그외', 'expense', p_travel);

    -- ⚠️ 기타비용
    INSERT INTO mdt_categories (name, type, ui_config) VALUES ('⚠️ 기타비용', 'expense', '{"color":"gray"}') RETURNING id INTO p_etc;
    INSERT INTO mdt_categories (name, type, parent_id) VALUES ('기타', 'expense', p_etc), ('지급수수료', 'expense', p_etc);

-- ==========================================
-- 2. Track A: Personal Life (가계부) - Income & Transfer
-- ==========================================
    
    -- 💼 사업소득 (수입)
    INSERT INTO mdt_categories (name, type, ui_config) VALUES ('💼 사업소득', 'income', '{"color":"blue"}') RETURNING id INTO p_biz_income;
    INSERT INTO mdt_categories (name, type, parent_id) VALUES 
    ('쾅 사업소득', 'income', p_biz_income), ('영 사업소득', 'income', p_biz_income), ('쾅영 사업소득', 'income', p_biz_income), ('블로그', 'income', p_biz_income);

    -- 💵 금융소득 (수입)
    INSERT INTO mdt_categories (name, type, ui_config) VALUES ('💵 금융소득', 'income', '{"color":"green"}') RETURNING id INTO p_fin_income;
    INSERT INTO mdt_categories (name, type, parent_id) VALUES ('이자소득', 'income', p_fin_income);

    -- 🔄 이체
    INSERT INTO mdt_categories (name, type, ui_config) VALUES ('🔄 이체', 'transfer', '{"color":"slate"}') RETURNING id INTO p_transfer;
    INSERT INTO mdt_categories (name, type, parent_id) VALUES 
    ('내부 이체', 'transfer', p_transfer), ('카드대금 결제', 'transfer', p_transfer), ('저축 불입', 'transfer', p_transfer);

-- ==========================================
-- 3. Track B: Business ERP (Business Units V2)
-- ==========================================

    -- 🏢 Business Units
    INSERT INTO business_units (name, type, metadata) VALUES 
    ('💡 Lighting Crew', 'production', '{"owner": "husband", "role": "technical"}'),
    ('🎨 Design Studio', 'creative', '{"owner": "wife", "role": "design"}'),
    ('📷 Photo & Goods', 'commerce', '{"owner": "joint", "role": "hybrid"}');

    -- 🔗 Business Categories (Linked to Units logically via type)
    -- Lighting Crew (Technical)
    INSERT INTO mdt_categories (name, type, ui_config, is_business_only) VALUES ('조명 연출/렌탈', 'income', '{"color":"yellow"}', true) RETURNING id INTO p_lc;
    INSERT INTO mdt_categories (name, type, is_business_only, parent_id) VALUES 
    ('연출료', 'income', true, p_lc), ('장비 렌탈', 'income', true, p_lc), ('인건비(수입)', 'income', true, p_lc);

    -- Design Studio (Design)
    INSERT INTO mdt_categories (name, type, ui_config, is_business_only) VALUES ('디자인 용역', 'income', '{"color":"purple"}', true) RETURNING id INTO p_dp;
    INSERT INTO mdt_categories (name, type, is_business_only, parent_id) VALUES 
    ('브랜딩', 'income', true, p_dp), ('웹디자인', 'income', true, p_dp), ('인쇄물', 'income', true, p_dp);

    -- Photo & Goods (Commerce/Joint)
    INSERT INTO mdt_categories (name, type, ui_config, is_business_only) VALUES ('촬영/굿즈', 'income', '{"color":"pink"}', true) RETURNING id INTO p_sub; -- p_sub reused for var name but it's new
    INSERT INTO mdt_categories (name, type, is_business_only, parent_id) VALUES 
    ('웨딩/스냅', 'income', true, p_sub), ('상업 굿즈', 'income', true, p_sub), ('아트 프린트', 'income', true, p_sub);

END $$;

-- ==========================================
-- 4. ALM (Assets & Liabilities)
-- ==========================================

-- 💰 Assets
-- 💰 현금·예금
INSERT INTO assets_liabilities (name, category, is_business_asset, current_valuation) VALUES
('의영 개인/기업은행', 'asset', false, 0),
('쾅영부부 입출금/기업은행', 'asset', false, 0),
('쾅영 생활비/국민은행', 'asset', false, 0),
('수입/우리은행', 'asset', false, 0),
('광준/개인계좌/기업은행', 'asset', false, 0),
('광준/사업자 계좌/기업은행', 'asset', true, 0),
('KB 예수금', 'asset', false, 0), -- CMA
('현금', 'asset', false, 0);

-- 📈 저축·투자
INSERT INTO assets_liabilities (name, category, is_business_asset, current_valuation) VALUES
('청년 주택드립 청약통장/우리은행', 'investment', false, 0),
('세이프박스/카카오뱅크', 'investment', false, 0),
('경조사/카카오뱅크', 'investment', false, 0),
('KB 주식', 'investment', false, 0);

-- 🚘 기타자산
INSERT INTO assets_liabilities (name, category, is_business_asset, current_valuation) VALUES
('미담헤어', 'asset', false, 0); -- 선급비용

-- 🏦 Liabilities
-- 💳 신용카드
INSERT INTO assets_liabilities (name, category, is_business_asset, current_valuation) VALUES
('의영/삼성카드(할부)', 'liability', false, 0),
('광준/사업자 삼성카드(할부)', 'liability', true, 0),
('쾅영/현대카드(할부)', 'liability', false, 0),
('광준/기업은행카드(할부)', 'liability', true, 0),
('광준/사업자 삼성카드(일시불)', 'liability', true, 0),
('쾅영/현대카드(일시불)', 'liability', false, 0);

-- 🏦 장기부채
INSERT INTO assets_liabilities (name, category, is_business_asset, current_valuation) VALUES
('학자금 광준/사업자/기업은행', 'liability', true, 0);
