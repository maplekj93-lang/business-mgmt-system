-- ================================================================
-- Sprint 1 Migration: Safety Net, Income Tax, Bank Sync Verifier
-- ================================================================

-- 1. user_settings 테이블 신규 생성
--    (Sprint 1~3 전체에서 사용할 사용자 설정을 한 번에 설계)
CREATE TABLE IF NOT EXISTS public.user_settings (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Safety Net (M-2)
    monthly_living_expense  NUMERIC DEFAULT 3000000,    -- 월 고정 생활비
    buffer_warning_pct      INTEGER DEFAULT 50,         -- 버퍼 경고 임계값 (%)

    -- Income Tax Reserve (M-1)
    income_tax_rate         NUMERIC DEFAULT 0.15,       -- 종소세율 (기본 15%)

    -- Virtual Salary (M-5)
    virtual_salary_amount   NUMERIC DEFAULT 0,          -- 가상 월급액
    virtual_salary_day      INTEGER DEFAULT 25,         -- 가상 월급 지급일 (매월 N일)

    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now(),

    UNIQUE(user_id)
);

-- RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_settings: own rows only"
    ON public.user_settings FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. assets 테이블에 is_safety_net 플래그 추가
--    (Safety Net 잔고를 별도 입력 없이 기존 계좌 잔고에서 자동 집계)
ALTER TABLE public.assets
    ADD COLUMN IF NOT EXISTS is_safety_net   BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS current_balance NUMERIC DEFAULT 0;

-- 3. crew_payments 테이블에 Bank Sync 컬럼 추가
ALTER TABLE public.crew_payments
    ADD COLUMN IF NOT EXISTS bank_verified  BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS verified_at    TIMESTAMPTZ;

-- 4. transactions 테이블에 is_virtual_salary 플래그 추가
ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS is_virtual_salary BOOLEAN DEFAULT false;
