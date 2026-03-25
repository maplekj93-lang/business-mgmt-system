-- Migration: 20260324_calculate_cashflow_stats.sql
-- Description: Creates an RPC to calculate cashflow statistics for the Phase 1 dashboard.

CREATE OR REPLACE FUNCTION calculate_cashflow_stats(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
) RETURNS jsonb AS $$
DECLARE
  v_business_income numeric := 0;
  v_business_expense numeric := 0;
  v_personal_income numeric := 0;
  v_personal_expense numeric := 0;
  v_expected_income numeric := 0;
  v_result jsonb;
BEGIN
  -- Calculate Actual Flow (from transactions joined with categories)
  SELECT 
    COALESCE(SUM(CASE WHEN t.allocation_status LIKE 'business_%' AND c.type = 'income' THEN t.amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN t.allocation_status LIKE 'business_%' AND c.type = 'expense' THEN t.amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN t.allocation_status = 'personal' AND c.type = 'income' THEN t.amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN t.allocation_status = 'personal' AND c.type = 'expense' THEN t.amount ELSE 0 END), 0)
  INTO 
    v_business_income, 
    v_business_expense, 
    v_personal_income, 
    v_personal_expense
  FROM transactions t
  LEFT JOIN mdt_categories c ON t.category_id = c.id
  WHERE t.user_id = p_user_id
    AND t.date >= p_start_date::text
    AND t.date <= p_end_date::text
    AND c.type != 'transfer'; -- Exclude transfers (credit card payments, proxy charges)

  -- Calculate Expected Income (from daily_rate_logs)
  SELECT 
    COALESCE(SUM(total_amount), 0)
  INTO 
    v_expected_income
  FROM daily_rate_logs
  WHERE user_id = p_user_id
    AND payment_status = 'pending';
    -- Currently grabbing all pending regardless of date to show total pipeline.

  -- Return as JSON
  v_result := jsonb_build_object(
    'business_income', v_business_income,
    'business_expense', v_business_expense,
    'personal_income', v_personal_income,
    'personal_expense', v_personal_expense,
    'expected_income', v_expected_income
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
