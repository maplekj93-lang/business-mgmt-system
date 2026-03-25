-- 20260324_dutch_pay_and_asset_types.sql
-- 더치페이 정산 관리 테이블 및 자산 유형 확장 마이그레이션

-- [1] dutch_pay_groups 테이블 생성
CREATE TABLE IF NOT EXISTS public.dutch_pay_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    owner_id UUID REFERENCES auth.users(id),
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    is_settled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    due_date DATE
);

-- [2] dutch_pay_members 테이블 생성
CREATE TABLE IF NOT EXISTS public.dutch_pay_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.dutch_pay_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount_to_pay NUMERIC NOT NULL DEFAULT 0,
    is_paid BOOLEAN DEFAULT false,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- [3] RLS 활성화
ALTER TABLE public.dutch_pay_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dutch_pay_members ENABLE ROW LEVEL SECURITY;

-- [4] RLS 정책 설정
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow users to manage their own dutch pay groups') THEN
        CREATE POLICY "Allow users to manage their own dutch pay groups" 
        ON public.dutch_pay_groups FOR ALL 
        USING (auth.uid() = owner_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow users to manage members of their own groups') THEN
        CREATE POLICY "Allow users to manage members of their own groups" 
        ON public.dutch_pay_members FOR ALL 
        USING (
            EXISTS (
                SELECT 1 FROM public.dutch_pay_groups 
                WHERE id = dutch_pay_members.group_id AND owner_id = auth.uid()
            )
        );
    END IF;
END $$;

-- [5] assets 테이블의 asset_type 제약 조건 업데이트
-- 기존 제약 조건 삭제 후 확장된 유형 포함하여 재등록
ALTER TABLE public.assets DROP CONSTRAINT IF EXISTS assets_asset_type_check;
ALTER TABLE public.assets ADD CONSTRAINT assets_asset_type_check 
CHECK (asset_type = ANY (ARRAY['bank_account'::text, 'credit_card'::text, 'debit_card'::text, 'pay_proxy'::text, 'cash'::text, 'investment'::text, 'insurance'::text, 'debt'::text, 'other'::text]));

-- [6] 기존 데이터 보정 (필요시)
-- '현금·예금' 등으로 잘못 들어가 있는 데이터를 'pay_proxy' 또는 적절한 유형으로 변경
UPDATE public.assets SET asset_type = 'pay_proxy' WHERE asset_type = '현금·예금';
