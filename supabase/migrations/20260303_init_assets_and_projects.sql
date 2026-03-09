-- Phase 1 Migration: Init Assets and Projects
-- 1. 기존 데이터 초기화 (24~25년 데이터 리셋)
TRUNCATE TABLE public.transactions CASCADE;
-- 2. 자산(Assets) 테이블 생성
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_type TEXT NOT NULL,
    -- '남편', '아내', '회사', '공동' 등
    asset_type TEXT NOT NULL,
    -- '신용카드', '체크카드', '은행계좌', '현금' 등
    name TEXT NOT NULL,
    identifier_keywords TEXT [] DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- 3. 프로젝트(Projects) 테이블 생성
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    start_date DATE,
    budget NUMERIC DEFAULT 0,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- 4. 거래내역(Transactions) 테이블 컬럼 추가
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES public.assets(id) ON DELETE
SET NULL,
    ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE
SET NULL,
    ADD COLUMN IF NOT EXISTS receipt_memo TEXT,
    ADD COLUMN IF NOT EXISTS is_reimbursable BOOLEAN DEFAULT false;
-- 5. RLS (Row Level Security) 설정
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
-- 정책: 본인이 생성한 자산만 관리
CREATE POLICY "Users can view own assets" ON public.assets FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assets" ON public.assets FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assets" ON public.assets FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own assets" ON public.assets FOR DELETE USING (auth.uid() = user_id);
-- 정책: 본인이 생성한 프로젝트만 관리
CREATE POLICY "Users can view own projects" ON public.projects FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON public.projects FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);