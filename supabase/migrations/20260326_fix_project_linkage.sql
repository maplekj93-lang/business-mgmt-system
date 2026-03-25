-- ================================================================
-- Phase 5: Fix Project Linkage and RPC Issues
-- ================================================================

-- 1. daily_rate_logs 테이블에 project_id 컬럼 추가 (프로젝트별 수익 분석용)
ALTER TABLE public.daily_rate_logs
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- 2. 기존 데이터 마이그레이션 (site_name이 프로젝트 이름과 일치하는 경우 자동 연결 - Best effort)
UPDATE public.daily_rate_logs drl
SET project_id = p.id
FROM public.projects p
WHERE drl.site_name = p.name
AND drl.project_id IS NULL;

-- 3. get_project_profitability RPC v2 재배포 (컬럼 추가 반영)
DROP FUNCTION IF EXISTS public.get_project_profitability(text);
DROP FUNCTION IF EXISTS public.get_project_profitability(text, text);

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
        -- 1. daily_rate_logs 기반 매출
        SELECT 
            p.id as pid,
            COALESCE(SUM(drl.amount_gross), 0) as drl_rev
        FROM projects p
        LEFT JOIN daily_rate_logs drl ON drl.project_id = p.id
        WHERE p.user_id = v_user_id
        GROUP BY p.id
    ),
    project_incomes_rev AS (
        -- 2. project_incomes 기반 매출
        SELECT 
            p.id as pid,
            COALESCE(SUM(pi.amount), 0) as pi_rev
        FROM projects p
        LEFT JOIN project_incomes pi ON pi.project_id = p.id
        WHERE p.user_id = v_user_id
        GROUP BY p.id
    ),
    project_labor AS (
        -- 3. crew_payments 기반 인건비 (daily_rate_logs를 거쳐 연결)
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
        -- 4. transactions 기반 기타 경비
        SELECT 
            p.id as pid,
            COALESCE(SUM(ABS(t.amount)), 0) as total_exp
        FROM projects p
        LEFT JOIN transactions t ON t.project_id = p.id
        LEFT JOIN mdt_categories c ON t.category_id = c.id
        WHERE p.user_id = v_user_id
        AND c.type = 'expense'
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
        END as profit_margin,
        p.business_owner as owner_id,
        p.status::text as status
    FROM projects p
    LEFT JOIN project_revenue rev1 ON rev1.pid = p.id
    LEFT JOIN project_incomes_rev rev2 ON rev2.pid = p.id
    LEFT JOIN project_labor lab ON lab.pid = p.id
    LEFT JOIN project_expenses exp ON exp.pid = p.id
    WHERE p.user_id = v_user_id
    AND (p_owner_id IS NULL OR p.business_owner = p_owner_id)
    AND (p_status IS NULL OR p.status::text = p_status)
    ORDER BY revenue DESC;
END;
$$;
