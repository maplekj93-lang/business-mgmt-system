-- Migration: Enhance get_dashboard_stats RPC
-- Purpose: Fix CTE scope issue and support Business Categories

DROP FUNCTION IF EXISTS get_dashboard_stats(text);

CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_mode text -- 'personal' or 'business'
)
RETURNS TABLE (
  total_income numeric,
  total_expense numeric,
  net_profit numeric,
  trend jsonb,
  unit_breakdown jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_total_income numeric := 0;
  v_total_expense numeric := 0;
  v_trend jsonb;
  v_unit_breakdown jsonb := '[]'::jsonb;
BEGIN

  -- 1. Create a temporary table for filtered transactions to avoid CTE scoping issues
  -- This ensures filtered_tx)temp is available throughout the function
  CREATE TEMP TABLE filtered_txs_temp ON COMMIT DROP AS
  SELECT 
    t.amount,
    t.date,
    c.type as category_type,
    COALESCE(bu.name, CASE WHEN c.is_business_only THEN '공통/미지정' ELSE NULL END) as unit_name,
    c.is_business_only
  FROM transactions t
  LEFT JOIN mdt_categories c ON t.category_id = c.id
  LEFT JOIN business_units bu ON t.business_unit_id = bu.id
  WHERE t.user_id = v_user_id
  AND (
    (p_mode = 'personal' AND t.allocation_status = 'personal' AND COALESCE(c.is_business_only, FALSE) = FALSE)
    OR
    (p_mode = 'business' AND (t.business_unit_id IS NOT NULL OR COALESCE(c.is_business_only, FALSE) = TRUE))
  );

  -- 2. Calculate Grand Totals & Monthly Trend
  WITH monthly_agg AS (
    SELECT
      EXTRACT(YEAR FROM date) as year,
      EXTRACT(MONTH FROM date) as month,
      SUM(CASE 
        WHEN category_type = 'income' THEN ABS(amount)
        WHEN category_type = 'expense' THEN 0 
        ELSE CASE WHEN amount > 0 THEN ABS(amount) ELSE 0 END
      END) as monthly_income,
      SUM(CASE 
        WHEN category_type = 'expense' THEN ABS(amount)
        WHEN category_type = 'income' THEN 0
        ELSE CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END
      END) as monthly_expense
    FROM filtered_txs_temp
    GROUP BY 1, 2
  )
  SELECT 
    COALESCE(SUM(monthly_income), 0),
    COALESCE(SUM(monthly_expense), 0),
    jsonb_agg(
      jsonb_build_object(
        'year', year,
        'month', month,
        'income', monthly_income,
        'expense', monthly_expense,
        'profit', (monthly_income - monthly_expense)
      ) ORDER BY year ASC, month ASC
    )
  INTO v_total_income, v_total_expense, v_trend
  FROM monthly_agg;

  -- 3. Business Unit Breakdown (Only for business mode)
  IF p_mode = 'business' THEN
    SELECT jsonb_agg(d) INTO v_unit_breakdown
    FROM (
      SELECT 
        unit_name,
        SUM(CASE WHEN category_type = 'income' THEN ABS(amount) ELSE 0 END) as income,
        SUM(CASE WHEN category_type = 'expense' THEN ABS(amount) ELSE 0 END) as expense,
        SUM(CASE WHEN category_type = 'income' THEN ABS(amount) ELSE -ABS(amount) END) as net
      FROM filtered_txs_temp
      WHERE unit_name IS NOT NULL
      GROUP BY unit_name
    ) d;
  END IF;

  RETURN QUERY SELECT 
    v_total_income, 
    v_total_expense, 
    (v_total_income - v_total_expense),
    COALESCE(v_trend, '[]'::jsonb),
    COALESCE(v_unit_breakdown, '[]'::jsonb);
END;
$$;
