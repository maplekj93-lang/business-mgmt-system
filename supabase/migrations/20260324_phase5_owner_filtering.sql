-- ================================================================
-- Phase 5: Owner-Specific Dashboard Filtering (FINAL)
-- ================================================================

-- 1. daily_rate_logs 테이블에 owner_id 컬럼 추가 (비즈니스 구분용)
ALTER TABLE public.daily_rate_logs
    ADD COLUMN IF NOT EXISTS owner_id TEXT DEFAULT 'kwangjun';

-- 2. get_dashboard_stats RPC 업데이트: p_owner_id 지원
DROP FUNCTION IF EXISTS public.get_dashboard_stats(text);
DROP FUNCTION IF EXISTS public.get_dashboard_stats(text, uuid);

CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
    p_mode text DEFAULT 'total',
    p_owner_id text DEFAULT NULL
)
RETURNS TABLE (
    total_income numeric, 
    total_expense numeric, 
    net_profit numeric,
    trend jsonb, 
    unit_breakdown jsonb
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_total_income numeric := 0; 
    v_total_expense numeric := 0;
    v_trend jsonb; 
    v_unit_breakdown jsonb := '[]'::jsonb;
BEGIN
    CREATE TEMP TABLE filtered_txs_temp ON COMMIT DROP AS
    SELECT t.amount, t.date, c.type as category_type,
           COALESCE(bu.name, CASE WHEN c.is_business_only THEN '공통/미지정' ELSE NULL END) as unit_name,
           COALESCE(t.owner_type, t.owner) as tx_owner
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
    )
    AND (
        p_owner_id IS NULL 
        OR COALESCE(t.owner_type, t.owner) = p_owner_id
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

-- 3. get_advanced_analytics RPC 업데이트: p_owner_id 지원
DROP FUNCTION IF EXISTS public.get_advanced_analytics(text, int, int);
CREATE OR REPLACE FUNCTION public.get_advanced_analytics(
  p_mode text,
  p_month int,
  p_year int,
  p_owner_id text DEFAULT NULL
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
  )
  AND (
    p_owner_id IS NULL 
    OR COALESCE(t.owner_type, t.owner) = p_owner_id
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

-- 4. calculate_cashflow_stats RPC 업데이트: p_owner_id 지원
DROP FUNCTION IF EXISTS public.calculate_cashflow_stats(uuid, date, date);
CREATE OR REPLACE FUNCTION public.calculate_cashflow_stats(
    p_user_id uuid,
    p_start_date date,
    p_end_date date,
    p_owner_id text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
    v_total_paid_logs numeric;
    v_total_pending_logs numeric;
    v_total_settled_txs numeric;
    v_matching_count int;
    v_total_count int;
    v_result jsonb;
BEGIN
    -- 1. 현장 기록 (실제 매출 발생 기록) - owner_id 필터링 포함
    SELECT 
        COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END), 0),
        COUNT(*)
    INTO v_total_paid_logs, v_total_pending_logs, v_total_count
    FROM daily_rate_logs
    WHERE user_id = p_user_id
    AND date >= p_start_date AND date <= p_end_date
    AND (p_owner_id IS NULL OR owner_id = p_owner_id);

    -- 2. 실제 입금 내역 (트랜잭션 테이블) - owner_type 필터링 포함
    SELECT COALESCE(SUM(amount), 0), COUNT(*)
    INTO v_total_settled_txs, v_matching_count
    FROM transactions
    WHERE user_id = p_user_id
    AND date >= p_start_date AND date <= p_end_date
    AND category_id IN (SELECT id FROM mdt_categories WHERE type = 'income')
    AND (p_owner_id IS NULL OR COALESCE(owner_type, owner) = p_owner_id);

    v_result := jsonb_build_object(
        'total_expected', v_total_paid_logs + v_total_pending_logs,
        'total_received', v_total_settled_txs,
        'pending_receivable', v_total_pending_logs,
        'matching_health', CASE WHEN v_total_count = 0 THEN 100 ELSE (v_matching_count::float / v_total_count::float * 100) END,
        'pending_count', v_total_count - v_matching_count,
        'total_count', v_total_count
    );

    RETURN v_result;
END;
$$;
