-- Phase 4 ERP Schema Migration
-- Created: 2026-03-26
-- Purpose: Add business profiles, clients, projects (ERP version), daily rate logs, crew payments, site expenses

--- ========================================
--- 1-A. 신규 테이블 생성 (의존성 없음)
--- ========================================

-- ① business_profiles (자사 정보)
CREATE TABLE public.business_profiles (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_type           TEXT NOT NULL
                         CHECK (owner_type IN ('kwangjun', 'euiyoung', 'joint')),
    business_name        TEXT NOT NULL,
    representative_name  TEXT NOT NULL,
    business_number      TEXT,
    address              TEXT,
    bank_name            TEXT,
    account_number       TEXT,
    portfolio_url        TEXT,
    intro_document_url   TEXT,
    include_portfolio    BOOLEAN DEFAULT false,
    is_default           BOOLEAN DEFAULT false,
    created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_business_profiles_owner_type ON public.business_profiles(owner_type);

-- ② clients (거래처)
CREATE TABLE public.clients (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             TEXT NOT NULL,
    business_number  TEXT,
    files            JSONB DEFAULT '[]',
    contacts         JSONB DEFAULT '[]',
    created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_clients_name ON public.clients(name);

--- ========================================
--- 1-B. 기존 projects 테이블 ERP로 교체
--- ========================================

-- ① transactions의 FK 제약 임시 제거
ALTER TABLE public.transactions
    DROP CONSTRAINT IF EXISTS transactions_project_id_fkey;

-- ② 기존 projects 테이블 제거
DROP TABLE IF EXISTS public.projects CASCADE;

-- ③ ERP용 projects 테이블 재생성
CREATE TABLE public.projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    client_id       UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    business_owner  TEXT NOT NULL
                    CHECK (business_owner IN ('kwangjun', 'euiyoung', 'joint')),
    income_type     TEXT NOT NULL
                    CHECK (income_type IN ('freelance', 'daily_rate', 'photo_project')),
    categories      TEXT[] DEFAULT '{}',
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'completed', 'cancelled')),
    duration_days   NUMERIC,
    start_date      DATE,
    end_date        DATE,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_projects_client_id      ON public.projects(client_id);
CREATE INDEX idx_projects_business_owner ON public.projects(business_owner);
CREATE INDEX idx_projects_status         ON public.projects(status);

-- ④ transactions → projects FK 복원
ALTER TABLE public.transactions
    ADD CONSTRAINT transactions_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

--- ========================================
--- 1-C. 나머지 신규 테이블 (projects 의존)
--- ========================================

-- ① project_incomes (수입 파이프라인)
CREATE TABLE public.project_incomes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id              UUID NOT NULL
                            REFERENCES public.projects(id) ON DELETE CASCADE,
    title                   TEXT NOT NULL,
    amount                  NUMERIC NOT NULL DEFAULT 0,
    expected_date           DATE,
    status                  TEXT NOT NULL DEFAULT '의뢰중'
                            CHECK (status IN (
                                '의뢰중', '작업중', '보류취소',
                                '작업완료', '수정완료',
                                '입금대기', '입금완료', '포스팅완료'
                            )),
    matched_transaction_id  UUID,
    created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_project_incomes_project_id ON public.project_incomes(project_id);
CREATE INDEX idx_project_incomes_status     ON public.project_incomes(status);

-- ② daily_rate_logs (광준 일당)
CREATE TABLE public.daily_rate_logs (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID REFERENCES auth.users(id),
    client_id               UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    work_date               DATE NOT NULL,
    site_name               TEXT NOT NULL,
    amount_gross            NUMERIC NOT NULL,
    withholding_rate        NUMERIC DEFAULT 0,
    amount_net              NUMERIC GENERATED ALWAYS AS
                            (amount_gross * (1 - withholding_rate / 100)) STORED,
    payment_status          TEXT DEFAULT 'pending'
                            CHECK (payment_status IN ('pending', 'paid')),
    payment_date            DATE,
    matched_transaction_id  UUID,
    created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_daily_rate_logs_user_id   ON public.daily_rate_logs(user_id);
CREATE INDEX idx_daily_rate_logs_work_date ON public.daily_rate_logs(work_date);
CREATE INDEX idx_daily_rate_logs_client_id ON public.daily_rate_logs(client_id);

-- ③ crew_payments (크루원 인건비)
CREATE TABLE public.crew_payments (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_rate_log_id    UUID NOT NULL
                         REFERENCES public.daily_rate_logs(id) ON DELETE CASCADE,
    crew_name            TEXT NOT NULL,
    role                 TEXT CHECK (role IN ('세컨', '서드', '막내', '기타')),
    amount_gross         NUMERIC NOT NULL,
    withholding_rate     NUMERIC DEFAULT 3.3,
    amount_net           NUMERIC GENERATED ALWAYS AS
                         (amount_gross * (1 - withholding_rate / 100)) STORED,
    account_info         TEXT,
    paid                 BOOLEAN DEFAULT false,
    paid_date            DATE
);

CREATE INDEX idx_crew_payments_log_id ON public.crew_payments(daily_rate_log_id);

-- ④ site_expenses (현장 진행비)
CREATE TABLE public.site_expenses (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_rate_log_id    UUID NOT NULL
                         REFERENCES public.daily_rate_logs(id) ON DELETE CASCADE,
    category             TEXT NOT NULL
                         CHECK (category IN ('주차비', '주유비', '톨비', '식비', '기타')),
    amount               NUMERIC NOT NULL,
    memo                 TEXT,
    receipt_url          TEXT,
    included_in_invoice  BOOLEAN DEFAULT true
);

CREATE INDEX idx_site_expenses_log_id ON public.site_expenses(daily_rate_log_id);

--- ========================================
--- 1-D. RLS 정책
--- ========================================

ALTER TABLE public.business_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_incomes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_rate_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_expenses      ENABLE ROW LEVEL SECURITY;

-- 부부 공동 계정 → 인증된 사용자 전체 접근 허용
CREATE POLICY "authenticated_all" ON public.business_profiles  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON public.clients            FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON public.projects           FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON public.project_incomes    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON public.daily_rate_logs    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON public.crew_payments      FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON public.site_expenses      FOR ALL USING (auth.role() = 'authenticated');

--- ========================================
--- 1-E. 시드 데이터
--- ========================================

INSERT INTO public.business_profiles
    (owner_type, business_name, representative_name, is_default, include_portfolio)
VALUES
    ('kwangjun', '정광준',          '정광준',          true, true),
    ('euiyoung', '송의영',          '송의영',          true, false),
    ('joint',    '스튜디오 (미확정)', '정광준·송의영',   true, true);

INSERT INTO public.clients (name, contacts) VALUES
    ('스튜디오리프',          '[]'),
    ('기브온',               '[]'),
    ('그립두드',             '[]'),
    ('한국 다이이치산쿄',     '[]');
