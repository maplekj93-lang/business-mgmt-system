-- Phase 2: Income Reconciliation (입금 내역 매칭) 고도화용 마이그레이션

-- 1. pg_trgm 익스텐션 활성화 (유사도 검색용)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. 매칭 매핑 테이블 (N:M 대응)
CREATE TABLE IF NOT EXISTS public.income_transaction_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    income_id UUID NOT NULL, -- project_incomes.id 또는 daily_rate_logs.id
    income_type TEXT NOT NULL CHECK (income_type IN ('project_income', 'daily_rate_log')),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    amount_allocated NUMERIC NOT NULL,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_income_tx_links_income_id ON public.income_transaction_links(income_id);
CREATE INDEX IF NOT EXISTS idx_income_tx_links_transaction_id ON public.income_transaction_links(transaction_id);

-- RLS 설정
ALTER TABLE public.income_transaction_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own income links" ON public.income_transaction_links
    FOR ALL USING (auth.uid() = user_id);

-- 3. 매칭 학습 규칙 테이블
CREATE TABLE IF NOT EXISTS public.income_matching_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid(),
    sender_name TEXT NOT NULL, -- 통장 입금자명 (예: "홍길동")
    project_keyword TEXT NOT NULL, -- 프로젝트 이름이나 키워드 (예: "A프로젝트")
    confidence_boost INTEGER DEFAULT 10, -- 가중치
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, sender_name, project_keyword)
);

-- RLS 설정
ALTER TABLE public.income_matching_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own matching rules" ON public.income_matching_rules
    FOR ALL USING (auth.uid() = user_id);

-- 4. 매칭 후보 조회 RPC (V2)
CREATE OR REPLACE FUNCTION public.get_income_matching_candidates_v2(
    p_income_id UUID,
    p_income_type TEXT,
    p_target_amount NUMERIC,
    p_search_query TEXT DEFAULT NULL
)
RETURNS TABLE (
    transaction_id UUID,
    transaction_date DATE,
    transaction_description TEXT,
    transaction_amount NUMERIC,
    confidence_score INTEGER,
    match_reason TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    WITH candidate_tx AS (
        -- 보안: 본인의 거래만 조회
        SELECT 
            t.id,
            t.date,
            t.description,
            t.amount
        FROM public.transactions t
        WHERE t.user_id = auth.uid()
          AND t.amount > 0 -- 수입만
          AND (p_search_query IS NULL OR t.description ILIKE '%' || p_search_query || '%')
    )
    SELECT 
        ctx.id as transaction_id,
        ctx.date as transaction_date,
        ctx.description as transaction_description,
        ctx.amount as transaction_amount,
        (
            CASE 
                WHEN ctx.amount = p_target_amount THEN 60 -- 금액 일치 시 기본 60점
                ELSE 0
            END +
            CASE 
                WHEN p_search_query IS NOT NULL AND ctx.description % p_search_query THEN 30 -- 이름 유사 시 30점
                ELSE 0
            END +
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM public.income_matching_rules r 
                    WHERE r.user_id = auth.uid() 
                      AND ctx.description ILIKE '%' || r.sender_name || '%'
                      AND r.is_active = true
                ) THEN 10 -- 학습된 규칙 존재 시 10점
                ELSE 0
            END
        )::INTEGER as confidence_score,
        CASE 
            WHEN ctx.amount = p_target_amount AND p_search_query IS NOT NULL AND ctx.description % p_search_query THEN '금액 및 이름 일치'
            WHEN ctx.amount = p_target_amount THEN '금액 일치'
            WHEN p_search_query IS NOT NULL AND ctx.description % p_search_query THEN '이름 유사'
            ELSE '잠재적 후보'
        END as match_reason
    FROM candidate_tx ctx
    ORDER BY confidence_score DESC, ctx.date DESC
    LIMIT 20;
END;
$$;

-- 5. 매칭 확정 및 학습 RPC (V2)
CREATE OR REPLACE FUNCTION public.confirm_income_matching_v2(
    p_income_id UUID,
    p_income_type TEXT,
    p_transaction_ids UUID[],
    p_amounts_allocated NUMERIC[],
    p_create_rule BOOLEAN DEFAULT true,
    p_rule_sender_name TEXT DEFAULT NULL,
    p_rule_keyword TEXT DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    i INTEGER;
    v_total_allocated NUMERIC := 0;
    v_target_amount NUMERIC;
BEGIN
    -- 0. 보안 검증: 각 트랜잭션이 본인 소유인지 확인
    FOR i IN 1 .. array_length(p_transaction_ids, 1) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.transactions WHERE id = p_transaction_ids[i] AND user_id = auth.uid()) THEN
            RAISE EXCEPTION '권한이 없거나 존재하지 않는 거래가 포함되어 있습니다. (ID: %)', p_transaction_ids[i];
        END IF;
    END LOOP;

    -- 1. 매핑 테이블 기록 및 합계 계산
    FOR i IN 1 .. array_length(p_transaction_ids, 1) LOOP
        INSERT INTO public.income_transaction_links (income_id, income_type, transaction_id, amount_allocated, user_id)
        VALUES (p_income_id, p_income_type, p_transaction_ids[i], p_amounts_allocated[i], auth.uid());
        v_total_allocated := v_total_allocated + p_amounts_allocated[i];
    END LOOP;

    -- 2. 상태 처리 (기존 시스템의 한국어 상태값 '입금완료' 사용)
    IF p_income_type = 'project_income' THEN
        SELECT amount INTO v_target_amount FROM public.project_incomes WHERE id = p_income_id;
        
        -- 이미 매칭된 금액 합산 확인 로직 (고도화 시 추가 가능)
        -- 현재는 이번에 할당된 금액이 전체 타겟의 95% 이상이면 완납으로 처리 (부동소수점 오차 감안)
        IF v_total_allocated >= (v_target_amount * 0.95) THEN
            UPDATE public.project_incomes
            SET status = '입금완료'
            WHERE id = p_income_id;
        END IF;
    ELSIF p_income_type = 'daily_rate_log' THEN
        SELECT amount_gross INTO v_target_amount FROM public.daily_rate_logs WHERE id = p_income_id;
        
        IF v_total_allocated >= (v_target_amount * 0.95) THEN
            UPDATE public.daily_rate_logs
            SET payment_status = '입금완료', -- 기존 시스템 규격에 맞춤
                payment_date = CURRENT_DATE
            WHERE id = p_income_id;
        END IF;
    END IF;

    -- 3. 학습 규칙 생성
    IF p_create_rule AND p_rule_sender_name IS NOT NULL AND p_rule_keyword IS NOT NULL THEN
        INSERT INTO public.income_matching_rules (user_id, sender_name, project_keyword)
        VALUES (auth.uid(), p_rule_sender_name, p_rule_keyword)
        ON CONFLICT (user_id, sender_name, project_keyword) DO NOTHING;
    END IF;
END;
$$;
