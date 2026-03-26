-- ================================================================
-- Update Project Profitability Analytics RPC (VAT Adjusted)
-- ================================================================

-- Revenue / 1.1 (Net Supply) 기준으로 수익성을 계산하도록 수정.
-- 기존 get_project_profitability 함수를 덮어씌웁니다.

CREATE OR REPLACE FUNCTION public.get_project_profitability(
    p_owner_id text DEFAULT NULL,
    p_status text DEFAULT NULL
)
RETURNS TABLE (
    project_id UUID,
    project_name TEXT,
    revenue NUMERIC,
    labor_cost NUMERIC,
    expenses NUMERIC,
    net_profit NUMERIC,
    profit_margin NUMERIC,
    owner_id TEXT,
    status TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id uuid := auth.uid();
BEGIN
    RETURN QUERY
    WITH project_revenue AS (
        -- 1. daily_rate_logs 기반 매출 (총액)
        SELECT 
            p.id as pid,
            COALESCE(SUM(drl.amount_gross), 0) as drl_rev
        FROM projects p
        LEFT JOIN daily_rate_logs drl ON drl.project_id = p.id
        WHERE p.user_id = v_user_id
        GROUP BY p.id
    ),
    project_incomes_rev AS (
        -- 2. project_incomes 기반 매출 (총액)
        SELECT 
            p.id as pid,
            COALESCE(SUM(pi.amount), 0) as pi_rev
        FROM projects p
        LEFT JOIN project_incomes pi ON pi.project_id = p.id
        WHERE p.user_id = v_user_id
        GROUP BY p.id
    ),
    project_labor AS (
        -- 3. crew_payments 기반 인건비 (이미 Net 기준으로 취급됨)
        SELECT 
            p.id as pid,
            COALESCE(SUM(cp.amount_gross), 0) as total_labor
        FROM projects p
        LEFT JOIN daily_rate_logs drl ON drl.project_id = p.id
        LEFT JOIN crew_payments cp ON cp.daily_rate_log_id = drl.id
        WHERE p.user_id = v_user_id
        GROUP BY p.id
    ),
    project_expenses AS (
        -- 4. transactions 기반 기타 경비 (이미 Net 기준으로 취급됨)
        SELECT 
            p.id as pid,
            COALESCE(SUM(ABS(t.amount)), 0) as total_exp
        FROM projects p
        LEFT JOIN transactions t ON t.project_id = p.id
        LEFT JOIN mdt_categories c ON t.category_id = c.id
        WHERE p.user_id = v_user_id
        AND c.type = 'expense'
        GROUP BY p.id
    ),
    raw_aggregated AS (
        SELECT 
            p.id as aid,
            p.name as aname,
            (COALESCE(rev1.drl_rev, 0) + COALESCE(rev2.pi_rev, 0)) as gross_rev,
            COALESCE(lab.total_labor, 0) as total_labor_cost,
            COALESCE(exp.total_exp, 0) as total_expenses,
            p.business_owner as aowner,
            p.status::text as astatus
        FROM projects p
        LEFT JOIN project_revenue rev1 ON rev1.pid = p.id
        LEFT JOIN project_incomes_rev rev2 ON rev2.pid = p.id
        LEFT JOIN project_labor lab ON lab.pid = p.id
        LEFT JOIN project_expenses exp ON exp.pid = p.id
        WHERE p.user_id = v_user_id
    )
    SELECT 
        aid,
        aname,
        gross_rev as revenue,
        total_labor_cost as labor_cost,
        total_expenses as expenses,
        -- ✅ 부가세 제외 순수익 계산 (Net Revenue - Costs)
        -- (Gross Revenue / 1.1) - Labor - Expenses
        ROUND((gross_rev / 1.1) - total_labor_cost - total_expenses) as net_profit,
        -- ✅ 수익률 계산 (Net Profit / Net Revenue * 100)
        CASE 
            WHEN gross_rev > 0 
            THEN ROUND(((gross_rev / 1.1) - total_labor_cost - total_expenses) / (gross_rev / 1.1) * 100, 2)
            ELSE 0 
        END as profit_margin,
        aowner as owner_id,
        astatus as status
    FROM raw_aggregated
    WHERE (p_owner_id IS NULL OR aowner = p_owner_id)
    AND (p_status IS NULL OR astatus = p_status)
    ORDER BY revenue DESC;
END;
$$;
