-- ================================================================
-- Sprint 2 Migration: Double-Count Prevention, Smart Tagging, Lead-Time
-- ================================================================

-- 1. mdt_allocation_rules 테이블 확장
--    (현재: keyword, category_id만 있음 → business 태깅 지원 추가)
ALTER TABLE public.mdt_allocation_rules
    ADD COLUMN IF NOT EXISTS is_business        BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS business_tag       TEXT,       -- '현장식대', '유류비', '소모품' 등
    ADD COLUMN IF NOT EXISTS match_type         TEXT DEFAULT 'contains',
    -- 'exact' | 'contains' | 'starts_with'
    ADD COLUMN IF NOT EXISTS priority           INTEGER DEFAULT 10;
    -- 숫자 낮을수록 먼저 적용 (exact > contains)

-- 2. transactions 테이블 — 이중 차단 관련 컬럼
--    (이미 allocation_status가 있으나 personal_excluded 플래그 추가)
ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS excluded_from_personal BOOLEAN DEFAULT false;
    -- 사업비로 태깅된 순간 가계부 집계에서 제외

-- 3. projects 테이블 — 입금 지연 추적용 컬럼
ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS invoice_sent_date  DATE,       -- 세금계산서 발행일
    ADD COLUMN IF NOT EXISTS expected_payment_date DATE,    -- 예상 입금일
    ADD COLUMN IF NOT EXISTS actual_payment_date   DATE;    -- 실제 입금 확인일
    -- lead_time = actual_payment_date - invoice_sent_date (계산 컬럼 불필요, 프론트 계산)

-- 4. clients 테이블 — 클라이언트별 평균 리드타임 캐시
ALTER TABLE public.clients
    ADD COLUMN IF NOT EXISTS avg_payment_lead_days  INTEGER,  -- 평균 입금 소요일 (자동 계산)
    ADD COLUMN IF NOT EXISTS total_projects_count   INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_revenue          NUMERIC DEFAULT 0;

-- 5. Update RPCs to exclude transactions tagged as business from personal stats
DROP FUNCTION IF EXISTS public.get_filtered_transactions(text, int, int, int, int);
CREATE OR REPLACE FUNCTION public.get_filtered_transactions(
        p_mode text DEFAULT 'personal',
        p_year int DEFAULT NULL,
        p_month int DEFAULT NULL,
        p_page int DEFAULT 1,
        p_limit int DEFAULT 50
    ) RETURNS TABLE (
        id uuid,
        date date,
        amount numeric,
        description text,
        category_id int,
        allocation_status text,
        business_unit_id uuid,
        source_raw_data jsonb,
        category_name text,
        category_type text,
        category_icon text,
        category_color text,
        parent_category_name text,
        asset_id uuid,
        asset_name text,
        asset_type text,
        owner_type text,
        tx_owner_type text,
        project_id uuid,
        project_name text,
        receipt_memo text,
        is_reimbursable boolean
    ) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id uuid := auth.uid();
v_offset int := (p_page - 1) * p_limit;
BEGIN RETURN QUERY
SELECT t.id,
    t.date,
    t.amount,
    t.description,
    t.category_id,
    t.allocation_status,
    t.business_unit_id,
    t.source_raw_data,
    c.name,
    c.type,
    c.ui_config->>'icon',
    c.ui_config->>'color',
    pc.name,
    t.asset_id,
    a.name,
    a.asset_type,
    a.owner_type,
    t.owner_type as tx_owner_type,
    t.project_id,
    pr.name,
    t.receipt_memo,
    t.is_reimbursable
FROM transactions t
    LEFT JOIN mdt_categories c ON t.category_id = c.id
    LEFT JOIN mdt_categories pc ON c.parent_id = pc.id
    LEFT JOIN assets a ON t.asset_id = a.id
    LEFT JOIN projects pr ON t.project_id = pr.id
WHERE t.user_id = v_user_id
    AND (
        (p_mode = 'total')
        OR (
            p_mode = 'business'
            AND (
                t.business_unit_id IS NOT NULL
                OR COALESCE(c.is_business_only, FALSE) = TRUE
            )
        )
        OR (
            p_mode = 'personal'
            AND COALESCE(t.excluded_from_personal, false) = false
            AND (
                (
                    t.allocation_status = 'personal'
                    AND COALESCE(c.is_business_only, FALSE) = FALSE
                )
                OR (
                    c.type = 'income'
                    AND COALESCE(c.is_business_only, FALSE) = FALSE
                )
            )
        )
    )
    AND (
        p_year IS NULL
        OR EXTRACT(
            YEAR
            FROM t.date
        ) = p_year
    )
    AND (
        p_month IS NULL
        OR EXTRACT(
            MONTH
            FROM t.date
        ) = p_month
    )
ORDER BY t.date DESC,
    t.id ASC
LIMIT p_limit OFFSET v_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_mode text)
RETURNS TABLE (
    total_income numeric, total_expense numeric, net_profit numeric,
    trend jsonb, unit_breakdown jsonb
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_total_income numeric := 0; v_total_expense numeric := 0;
    v_trend jsonb; v_unit_breakdown jsonb := '[]'::jsonb;
BEGIN
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
        (p_mode = 'personal' AND COALESCE(t.excluded_from_personal, false) = false AND (
            (t.allocation_status = 'personal' AND COALESCE(c.is_business_only, FALSE) = FALSE)
            OR
            (c.type = 'income' AND COALESCE(c.is_business_only, FALSE) = FALSE)
        ))
    );

    WITH monthly_agg AS (
        SELECT EXTRACT(YEAR FROM date) as year, EXTRACT(MONTH FROM date) as month,
               SUM(CASE WHEN category_type = 'income' THEN ABS(amount) ELSE 0 END) as monthly_income,
               SUM(CASE WHEN category_type = 'expense' THEN ABS(amount) ELSE 0 END) as monthly_expense
        FROM filtered_txs_temp GROUP BY 1, 2
    )
    SELECT COALESCE(SUM(monthly_income), 0), COALESCE(SUM(monthly_expense), 0),
           jsonb_agg(jsonb_build_object('year', year, 'month', month, 'income', monthly_income, 'expense', monthly_expense, 'profit', (monthly_income - monthly_expense)) ORDER BY year ASC, month ASC)
    INTO v_total_income, v_total_expense, v_trend FROM monthly_agg;

    IF p_mode = 'business' OR p_mode = 'total' THEN
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

CREATE OR REPLACE FUNCTION public.get_advanced_analytics(
  p_mode text,
  p_month int,
  p_year int
)
RETURNS TABLE (
  daily_trend jsonb,
  category_distribution jsonb,
  summary jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_start_date date := MAKE_DATE(p_year, p_month, 1);
  v_end_date date := (MAKE_DATE(p_year, p_month, 1) + INTERVAL '1 month' - INTERVAL '1 day')::date;
  v_daily_trend jsonb;
  v_category_distribution jsonb;
  v_summary jsonb;
BEGIN
  CREATE TEMP TABLE filtered_txs_analytics ON COMMIT DROP AS
  SELECT 
    t.amount,
    t.date,
    c.id as category_id,
    c.name as category_name,
    c.type as category_type,
    COALESCE(pc.name, c.name) as parent_category_name,
    c.ui_config->>'color' as color,
    c.ui_config->>'icon' as icon
  FROM transactions t
  LEFT JOIN mdt_categories c ON t.category_id = c.id
  LEFT JOIN mdt_categories pc ON c.parent_id = pc.id
  WHERE t.user_id = v_user_id
  AND t.date >= v_start_date AND t.date <= v_end_date
  AND (
    (p_mode = 'total')
    OR
    (p_mode = 'business' AND (t.business_unit_id IS NOT NULL OR COALESCE(c.is_business_only, FALSE) = TRUE))
    OR
    (p_mode = 'personal' AND COALESCE(t.excluded_from_personal, false) = false AND (
      (t.allocation_status = 'personal' AND COALESCE(c.is_business_only, FALSE) = FALSE)
      OR
      (c.type = 'income' AND COALESCE(c.is_business_only, FALSE) = FALSE)
    ))
  );

  SELECT jsonb_agg(d) INTO v_daily_trend
  FROM (
    WITH date_series AS (
      SELECT generate_series(v_start_date, v_end_date, '1 day'::interval)::date AS day
    )
    SELECT 
      ds.day as date,
      COALESCE(SUM(CASE WHEN f.amount > 0 THEN f.amount ELSE 0 END), 0) as income,
      COALESCE(ABS(SUM(CASE WHEN f.amount < 0 THEN f.amount ELSE 0 END)), 0) as expense
    FROM date_series ds
    LEFT JOIN filtered_txs_analytics f ON f.date = ds.day
    GROUP BY ds.day
    ORDER BY ds.day
  ) d;

  SELECT jsonb_agg(d) INTO v_category_distribution
  FROM (
    SELECT 
      parent_category_name as name,
      ABS(SUM(amount)) as value,
      MAX(color) as color,
      MAX(icon) as icon
    FROM filtered_txs_analytics
    WHERE category_type = 'expense'
    GROUP BY parent_category_name
    ORDER BY value DESC
  ) d;

  SELECT jsonb_build_object(
    'total_income', COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0),
    'total_expense', COALESCE(ABS(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)), 0),
    'transaction_count', COUNT(*)
  ) INTO v_summary
  FROM filtered_txs_analytics;

  RETURN QUERY SELECT 
    COALESCE(v_daily_trend, '[]'::jsonb),
    COALESCE(v_category_distribution, '[]'::jsonb),
    COALESCE(v_summary, '{}'::jsonb);
END;
$$;
