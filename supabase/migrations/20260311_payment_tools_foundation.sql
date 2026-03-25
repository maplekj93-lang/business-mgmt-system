-- Phase 1: Payment Tools Foundation (2026-03-11)
-- 가맹점 매칭 및 거래 분해를 위한 스키마 확장

-- 1. transactions 테이블 확장
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS breakdown_source_id UUID REFERENCES public.transactions(id),
ADD COLUMN IF NOT EXISTS kakao_pay_row_id TEXT;

-- 2. transaction_breakdowns 테이블 생성 (쿠팡 등 다중 항목 분해용)
CREATE TABLE IF NOT EXISTS public.transaction_breakdowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category_id INTEGER REFERENCES public.mdt_categories(id),
    track CHAR(1) CHECK (track IN ('A', 'B')), -- 'A': 개인, 'B': 비즈니스
    excluded_from_personal BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. kakao_pay_mappings 테이블 생성 (카카오페이 가맹점 매칭용)
CREATE TABLE IF NOT EXISTS public.kakao_pay_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    kakao_merchant_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    kakao_type TEXT, -- '[+] 부족분충전', '[-] 결제', '[-] 송금' 등
    matched_date DATE,
    category_id INTEGER REFERENCES public.mdt_categories(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 카카오페이 머니 자산 추가 (이미 존재하지 않는 경우)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.assets WHERE name = '카카오페이 머니') THEN
        INSERT INTO public.assets (name, asset_type, owner_type, current_balance)
        VALUES ('카카오페이 머니', '현금·예금', 'joint', 0);
    END IF;
END $$;

-- RLS 설정 (기존 정책 준수)
ALTER TABLE public.transaction_breakdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kakao_pay_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own breakdowns" ON public.transaction_breakdowns
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.transactions WHERE id = source_transaction_id));

CREATE POLICY "Users can manage their own breakdowns" ON public.transaction_breakdowns
    FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.transactions WHERE id = source_transaction_id));

CREATE POLICY "Users can view their own kakao mappings" ON public.kakao_pay_mappings
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.transactions WHERE id = source_transaction_id));

CREATE POLICY "Users can manage their own kakao mappings" ON public.kakao_pay_mappings
    FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.transactions WHERE id = source_transaction_id));
