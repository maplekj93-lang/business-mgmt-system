-- ================================================================
-- Phase 5: Project Profitability Analytics RPC
-- ================================================================

CREATE OR REPLACE FUNCTION public.get_project_profitability(
    p_owner_id text DEFAULT NULL
)
RETURNS TABLE (
    project_id UUID,
    project_name TEXT,
    revenue NUMERIC,
    labor_cost NUMERIC,
    expenses NUMERIC,
    net_profit NUMERIC,
    profit_margin NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id uuid := auth.uid();
BEGIN
    RETURN QUERY
    WITH project_revenue AS (
        -- 1. daily_rate_logs 기반 매출 (광준 전용 일당 등)
        SELECT 
            p.id as pid,
            COALESCE(SUM(drl.amount_gross), 0) as drl_rev
        FROM projects p
        LEFT JOIN daily_rate_logs drl ON drl.project_id = p.id
        WHERE p.user_id = v_user_id
        GROUP BY p.id
    ),
    project_incomes_rev AS (
        -- 2. project_incomes 기반 매출 (프로젝트성 수입)
        SELECT 
            p.id as pid,
            COALESCE(SUM(pi.amount), 0) as pi_rev
        FROM projects p
        LEFT JOIN project_incomes pi ON pi.project_id = p.id
        WHERE p.user_id = v_user_id
        GROUP BY p.id
    ),
    project_labor AS (
        -- 3. crew_payments 기반 인건비
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
        -- 4. transactions 기반 기타 경비 (인건비 제외)
        -- 인건비는 보통 특정 카테고리로 분류되므로 제외하거나, 직접 거래 내역 중 프로젝트 연결된 것 합산
        -- 여기서는 projects에 직접 연결된 transactions 중 지출인 것들을 합산
        -- 단, 인건비가 transactions에도 중복 기록될 수 있으므로 주의 필요.
        -- 일단 projects와 연결된 모든 지출 transactions 합산하되, 
        -- 만약 현장정산(site_expenses) 테이블을 쓴다면 그것도 고려 가능.
        SELECT 
            p.id as pid,
            COALESCE(SUM(ABS(t.amount)), 0) as total_exp
        FROM projects p
        LEFT JOIN transactions t ON t.project_id = p.id
        LEFT JOIN mdt_categories c ON t.category_id = c.id
        WHERE p.user_id = v_user_id
        AND c.type = 'expense'
        -- 인건비 카테고리(예: '인건비', '외주비')가 있다면 여기서 제외할 수도 있음
        -- 하지만 보통 transactions에는 법인카드 지출 등이 기록되므로 합산하는 것이 맞음
        GROUP BY p.id
    )
    SELECT 
        p.id,
        p.name,
        (rev1.drl_rev + rev2.pi_rev) as revenue,
        lab.total_labor as labor_cost,
        exp.total_exp as expenses,
        ((rev1.drl_rev + rev2.pi_rev) - lab.total_labor - exp.total_exp) as net_profit,
        CASE 
            WHEN (rev1.drl_rev + rev2.pi_rev) > 0 
            THEN (((rev1.drl_rev + rev2.pi_rev) - lab.total_labor - exp.total_exp) / (rev1.drl_rev + rev2.pi_rev) * 100)
            ELSE 0 
        END as profit_margin
    FROM projects p
    LEFT JOIN project_revenue rev1 ON rev1.pid = p.id
    LEFT JOIN project_incomes_rev rev2 ON rev2.pid = p.id
    LEFT JOIN project_labor lab ON lab.pid = p.id
    LEFT JOIN project_expenses exp ON exp.pid = p.id
    WHERE p.user_id = v_user_id
    AND (p_owner_id IS NULL OR p.business_owner = p_owner_id)
    AND p.status = 'active'
    ORDER BY revenue DESC;
END;
$$;
