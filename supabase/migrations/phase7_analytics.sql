-- Migration: Phase 7 Advanced Analytics RPC
-- Purpose: Provide granular data for daily trends and category distribution

CREATE OR REPLACE FUNCTION get_advanced_analytics(
  p_mode text, -- 'personal' or 'business'
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
  -- 1. Create a temporary table for filtered transactions
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
    (p_mode = 'personal' AND (
      (t.allocation_status = 'personal' AND COALESCE(c.is_business_only, FALSE) = FALSE)
      OR
      (c.type = 'income' AND COALESCE(c.is_business_only, FALSE) = FALSE)
    ))
  );

  -- 2. Daily Trend (Generate series to fill gaps)
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

  -- 3. Category Distribution (Group by Parent Category for high-level view)
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

  -- 4. Summary & MoM Calculation (Simplified for now)
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
