-- [Phase 4 Final Integration]
-- 1. 기존 함수들 정리 (Clean Slate)
DROP FUNCTION IF EXISTS get_dashboard_stats(text);
DROP FUNCTION IF EXISTS get_filtered_transactions(text, int, int, int, int);
DROP FUNCTION IF EXISTS get_unclassified_stats();

-- 2. 미분류 수신함 통계 RPC (Refined V2)
-- 개선점: 금액의 합계가 양수면 'income', 음수면 'expense'로 타입 자동 판별
CREATE OR REPLACE FUNCTION get_unclassified_stats()
RETURNS TABLE (
    raw_name text,
    count bigint,
    total_amount numeric,
    sample_date timestamp,
    transaction_ids uuid[],
    type text -- [NEW] UI 색상 구분을 위한 타입 필드 추가
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
SELECT
    COALESCE(source_raw_data->>'original_category', description, 'Unknown'),
    COUNT(*),
    SUM(amount),
    MAX(date),
    array_agg(id),
    CASE WHEN SUM(amount) >= 0 THEN 'income' ELSE 'expense' END
FROM transactions
WHERE category_id IS NULL
AND user_id = auth.uid()
GROUP BY 1
ORDER BY 2 DESC;
$$;

-- 3. 대시보드 통계 RPC (Twin-Track Support)
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_mode text)
RETURNS TABLE (
    total_income numeric, total_expense numeric, net_profit numeric,
    trend jsonb, unit_breakdown jsonb
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_total_income numeric := 0; v_total_expense numeric := 0;
    v_trend jsonb; v_unit_breakdown jsonb := '[]'::jsonb;
BEGIN
    -- Temp Table로 필터링 로직 중앙화
    CREATE TEMP TABLE filtered_txs_temp ON COMMIT DROP AS
    SELECT t.amount, t.date, c.type as category_type,
           COALESCE(bu.name, CASE WHEN c.is_business_only THEN '공통/미지정' ELSE NULL END) as unit_name
    FROM transactions t
    LEFT JOIN mdt_categories c ON t.category_id = c.id
    LEFT JOIN business_units bu ON t.business_unit_id = bu.id
    WHERE t.user_id = v_user_id
    AND (
        (p_mode = 'total')
        OR
        (p_mode = 'business' AND (t.business_unit_id IS NOT NULL OR COALESCE(c.is_business_only, FALSE) = TRUE))
        OR
        (p_mode = 'personal' AND (
            (t.allocation_status = 'personal' AND COALESCE(c.is_business_only, FALSE) = FALSE)
            OR
            (c.type = 'income' AND COALESCE(c.is_business_only, FALSE) = FALSE)
        ))
    );

    -- 월별 트렌드 집계
    WITH monthly_agg AS (
        SELECT EXTRACT(YEAR FROM date) as year, EXTRACT(MONTH FROM date) as month,
               SUM(CASE WHEN category_type = 'income' THEN ABS(amount) ELSE 0 END) as monthly_income,
               SUM(CASE WHEN category_type = 'expense' THEN ABS(amount) ELSE 0 END) as monthly_expense
        FROM filtered_txs_temp GROUP BY 1, 2
    )
    SELECT COALESCE(SUM(monthly_income), 0), COALESCE(SUM(monthly_expense), 0),
           jsonb_agg(jsonb_build_object('year', year, 'month', month, 'income', monthly_income, 'expense', monthly_expense, 'profit', (monthly_income - monthly_expense)) ORDER BY year ASC, month ASC)
    INTO v_total_income, v_total_expense, v_trend FROM monthly_agg;

    -- 비즈니스 모드일 때만 유닛별 분석 수행
    IF p_mode = 'business' THEN
        SELECT jsonb_agg(d) INTO v_unit_breakdown FROM (
            SELECT unit_name, SUM(CASE WHEN category_type = 'income' THEN ABS(amount) ELSE 0 END) as income,
                   SUM(CASE WHEN category_type = 'expense' THEN ABS(amount) ELSE 0 END) as expense,
                   SUM(CASE WHEN category_type = 'income' THEN ABS(amount) ELSE -ABS(amount) END) as net
            FROM filtered_txs_temp WHERE unit_name IS NOT NULL GROUP BY unit_name
        ) d;
    END IF;

    RETURN QUERY SELECT v_total_income, v_total_expense, (v_total_income - v_total_expense), COALESCE(v_trend, '[]'::jsonb), COALESCE(v_unit_breakdown, '[]'::jsonb);
END;
$$;

-- 4. 거래 내역 조회 RPC (PostgREST OR Limitation Solver)
CREATE OR REPLACE FUNCTION get_filtered_transactions(
    p_mode text DEFAULT 'personal', p_year int DEFAULT NULL, p_month int DEFAULT NULL, p_page int DEFAULT 1, p_limit int DEFAULT 50
) RETURNS TABLE (
    id uuid, date date, amount numeric, description text, category_id int, allocation_status text, business_unit_id uuid, source_raw_data jsonb,
    category_name text, category_type text, category_icon text, category_color text, parent_category_name text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_offset int := (p_page - 1) * p_limit;
BEGIN
    RETURN QUERY
    SELECT t.id, t.date, t.amount, t.description, t.category_id, t.allocation_status, t.business_unit_id, t.source_raw_data,
           c.name, c.type, c.ui_config->>'icon', c.ui_config->>'color', pc.name
    FROM transactions t
    LEFT JOIN mdt_categories c ON t.category_id = c.id
    LEFT JOIN mdt_categories pc ON c.parent_id = pc.id
    WHERE t.user_id = v_user_id
    AND (
        (p_mode = 'total')
        OR
        (p_mode = 'business' AND (t.business_unit_id IS NOT NULL OR COALESCE(c.is_business_only, FALSE) = TRUE))
        OR
        (p_mode = 'personal' AND (
            (t.allocation_status = 'personal' AND COALESCE(c.is_business_only, FALSE) = FALSE)
            OR
            (c.type = 'income' AND COALESCE(c.is_business_only, FALSE) = FALSE)
        ))
    )
    AND (p_year IS NULL OR EXTRACT(YEAR FROM t.date) = p_year)
    AND (p_month IS NULL OR EXTRACT(MONTH FROM t.date) = p_month)
    ORDER BY t.date DESC, t.id ASC LIMIT p_limit OFFSET v_offset;
END;
$$;

-- 5. 비즈니스 전용 카테고리 마킹 (Targeted Safe Update)
-- 주의: '%사업%' 와일드카드는 개인 가계부의 '사업비'까지 숨길 수 있어 위험함.
-- MDT_CATALOG.md Track B에 정의된 항목들만 명시적으로 업데이트합니다.

UPDATE mdt_categories
SET is_business_only = TRUE
WHERE name IN (
    -- Income Categories (Track B)
    '촬영 회차비', '장비 렌탈료', '디자인 용역', '사진 촬영', '아트 프린트 판매', '굿즈/프린트 판매', '촬영 용역',
    -- Expense Categories (Track B)
    '크루 인건비', '식대', '유류비', '자재/소모품', '인쇄/출력', '포장/배송', '소프트웨어 구독'
);
