-- ========================================
-- 키워드 규칙 정의 및 자동분류 스크립트
-- ========================================
DO $$
DECLARE v_user_id UUID := '40f1fcae-82d7-49a7-a0bf-8191382a6d03'::UUID;
v_card_payment_id INT := 121;
-- 카드대금 결제
v_internal_transfer_id INT := 122;
-- 내부 이체
v_student_loan_id INT := 124;
-- 학자금 상환
v_convenience_id INT := 19;
-- 식비 > 편의점
v_life_insurance_id INT := 37;
-- 보험료 > 생명보험
v_pension_id INT := 39;
-- 보험료 > 국민연금
v_interest_id INT := 119;
-- 금융소득 > 이자소득
v_tax_other_id INT := 87;
-- 세금 > 기타세금
v_fuel_id INT := 30;
-- 교통비 > 주유비
BEGIN -- ========== 1. 키워드 규칙 삽입 ==========
INSERT INTO mdt_allocation_rules (user_id, keyword, category_id)
VALUES -- 카드 결제들
    (v_user_id, '삼성카드결제', v_card_payment_id),
    (v_user_id, '삼성카드', v_card_payment_id),
    (v_user_id, '현대카드결제', v_card_payment_id),
    (v_user_id, '현대카드', v_card_payment_id),
    (v_user_id, '비씨카드', v_card_payment_id),
    (v_user_id, 'BC카드', v_card_payment_id),
    -- 계좌 이체
    (v_user_id, '우리은행', v_internal_transfer_id),
    (v_user_id, '국민은행', v_internal_transfer_id),
    (v_user_id, '기업은행', v_internal_transfer_id),
    (v_user_id, '카뱅', v_internal_transfer_id),
    -- 학자금
    (v_user_id, '한국장학재단', v_student_loan_id),
    -- 편의점
    (v_user_id, 'GS25', v_convenience_id),
    (v_user_id, 'CU', v_convenience_id),
    (v_user_id, '세븐일레븐', v_convenience_id),
    (v_user_id, '미니스톱', v_convenience_id),
    (v_user_id, 'GS칼텍스', v_fuel_id),
    -- 보험
    (v_user_id, 'KB생', v_life_insurance_id),
    (v_user_id, '국민연금', v_pension_id),
    -- 금융
    (v_user_id, '입출금통장 이자', v_interest_id),
    -- 세금
    (v_user_id, '국세청', v_tax_other_id),
    (v_user_id, '세무서', v_tax_other_id),
    (v_user_id, '종소세', v_tax_other_id) ON CONFLICT (user_id, keyword) DO
UPDATE
SET category_id = EXCLUDED.category_id;
-- ========== 2. 기존 미분류 거래에 자동분류 적용 ==========
UPDATE transactions
SET category_id = v_card_payment_id,
    allocation_status = 'personal'
WHERE user_id = v_user_id
    AND category_id IS NULL
    AND (
        description ILIKE '%삼성카드%'
        OR description ILIKE '%현대카드%'
        OR description ILIKE '%BC카드%'
        OR description ILIKE '%비씨카드%'
    );
UPDATE transactions
SET category_id = v_internal_transfer_id,
    allocation_status = 'personal'
WHERE user_id = v_user_id
    AND category_id IS NULL
    AND (
        description ILIKE '%우리은행%'
        OR description ILIKE '%국민은행%'
        OR description ILIKE '%기업은행%'
        OR description ILIKE '%카뱅%'
    );
UPDATE transactions
SET category_id = v_student_loan_id,
    allocation_status = 'personal'
WHERE user_id = v_user_id
    AND category_id IS NULL
    AND description ILIKE '%한국장학재단%';
UPDATE transactions
SET category_id = v_convenience_id,
    allocation_status = 'personal'
WHERE user_id = v_user_id
    AND category_id IS NULL
    AND (
        description ILIKE '%GS25%'
        OR description ILIKE '%CU%'
        OR description ILIKE '%세븐일레븐%'
        OR description ILIKE '%미니스톱%'
    );
UPDATE transactions
SET category_id = v_fuel_id,
    allocation_status = 'personal'
WHERE user_id = v_user_id
    AND category_id IS NULL
    AND (
        description ILIKE '%GS칼텍스%'
        OR description ILIKE '%주유소%'
        OR description ILIKE '%SK주유%'
    );
UPDATE transactions
SET category_id = v_life_insurance_id,
    allocation_status = 'personal'
WHERE user_id = v_user_id
    AND category_id IS NULL
    AND description ILIKE '%KB생%';
UPDATE transactions
SET category_id = v_pension_id,
    allocation_status = 'personal'
WHERE user_id = v_user_id
    AND category_id IS NULL
    AND description ILIKE '%국민연금%';
UPDATE transactions
SET category_id = v_interest_id,
    allocation_status = 'personal'
WHERE user_id = v_user_id
    AND category_id IS NULL
    AND description ILIKE '%이자%';
UPDATE transactions
SET category_id = v_tax_other_id,
    allocation_status = 'personal'
WHERE user_id = v_user_id
    AND category_id IS NULL
    AND (
        description ILIKE '%국세청%'
        OR description ILIKE '%세무서%'
        OR description ILIKE '%종소세%'
    );
RAISE NOTICE 'Keyword rules and auto-classification completed for user %',
v_user_id;
END $$;