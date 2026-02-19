CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_mode text -- 'personal' or 'business'
)
RETURNS TABLE (
  total_income numeric,
  total_expense numeric,
  net_profit numeric,
  trend jsonb
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
BEGIN

  -- 1. Calculate Grand Totals & Monthly Trend in one pass using CTE
  WITH filtered_txs AS (
    SELECT 
      t.amount,
      t.date,
      c.type as category_type
    FROM transactions t
    LEFT JOIN mdt_categories c ON t.category_id = c.id
    WHERE t.user_id = v_user_id
    AND (
      (p_mode = 'personal' AND t.allocation_status = 'personal')
      OR
      (p_mode = 'business' AND t.business_unit_id IS NOT NULL)
    )
  ),
  monthly_agg AS (
    SELECT
      to_char(date, 'YYYY-MM') as month_key,
      EXTRACT(YEAR FROM date) as year,
      EXTRACT(MONTH FROM date) as month,
      SUM(CASE 
        WHEN category_type = 'income' THEN ABS(amount)
        WHEN category_type = 'expense' THEN 0 
        ELSE CASE WHEN amount > 0 THEN ABS(amount) ELSE 0 END -- Fallback
      END) as monthly_income,
      SUM(CASE 
        WHEN category_type = 'expense' THEN ABS(amount)
        WHEN category_type = 'income' THEN 0
        ELSE CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END -- Fallback
      END) as monthly_expense
    FROM filtered_txs
    GROUP BY 1, 2, 3
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

  RETURN QUERY SELECT 
    v_total_income, 
    v_total_expense, 
    (v_total_income - v_total_expense),
    COALESCE(v_trend, '[]'::jsonb);
END;
$$;
