# 📋 Business ERP Phase 4 — 작업명세서

> **작성일:** 2026-03-05
> **기준 문서:** `docs/planning/ERP_DESIGN.md` + `docs/planning/TECHNICAL_SPECIFICATION.md`
> **수신:** Antigravity
> **목적:** 코드베이스 전체를 분석한 뒤 작성. 이 순서대로 따라가면 Phase 4가 완전히 구현됩니다.

---

## 🗺 현황 요약 — 이미 된 것 vs. 해야 할 것

### ✅ 이미 구현된 것 (건드리지 말 것)

| 영역 | 내용 |
|------|------|
| DB | `assets`, `transactions`, `mdt_categories`, `business_units`, `profiles` 테이블 |
| DB | `transactions.project_id` FK (기존 `projects` 테이블 참조 중) |
| entities | `asset/`, `transaction/`, `category/`, `analytics/`, `business/` |
| features | `ledger-import/`, `manage-categories/`, `refine-ledger/`, `auth/`, `allocate-transaction/` |
| widgets | `dashboard/`, `layout/`, `transaction-history/` |
| pages | `/` (대시보드), `/analytics`, `/manage/import`, `/settings/*`, `/transactions/unclassified` |

### 🔨 Phase 4에서 새로 만들 것

| 영역 | 내용 |
|------|------|
| DB (신규) | `business_profiles`, `clients`, `project_incomes`, `daily_rate_logs`, `crew_payments`, `site_expenses` |
| DB (교체) | 기존 `projects` 테이블 → ERP 스펙으로 교체 (⚠️ FK 처리 필요) |
| entities | `client/`, `project/` (교체), `daily-rate/` |
| features | `manage-business-profile/`, `manage-pipeline/`, `log-daily-rate/`, `calculate-tax/`, `manage-crew/` |
| widgets | `income-kanban/`, `business-dashboard/`, `client-list/`, `cashflow-calendar/` |
| pages | `/business/*` (신규 라우트 전체) |

---

## ⚠️ 중요 주의사항 — 반드시 읽을 것

### 1. 기존 `projects` 테이블 충돌
현재 DB의 `projects` 테이블은 ERP 설계와 **전혀 다른 스키마**입니다.

```sql
-- 현재 (구버전, 단순 가계부용)
projects: id, name, status, start_date, budget, user_id

-- 필요 (ERP용)
projects: id, name, client_id, business_owner, income_type, categories[], status, duration_days, start_date, end_date
```

`transactions.project_id`가 기존 `projects`를 FK 참조 중이므로, 아래 Step 1-B의 **마이그레이션 순서**를 반드시 지켜야 합니다. 임의 DROP 금지.

### 2. 기존 `src/entities/business/` 는 건드리지 말 것
`business_units` 테이블 조회용으로, 기존 가계부 분류 로직에서 사용 중입니다. ERP의 `business_profiles`와 이름이 비슷하지만 **별개**입니다.

### 3. `database.types.ts` 갱신 필수
마이그레이션 후 `src/shared/api/supabase/database.types.ts`를 Supabase CLI로 재생성해야 합니다.
```bash
npx supabase gen types typescript --project-id <your-project-id> > src/shared/api/supabase/database.types.ts
```

---

## Step 1: DB Migration

Supabase Dashboard → SQL Editor에서 **1-A → 1-B → 1-C 순서**로 실행합니다.

### 1-A. 신규 테이블 생성 (의존성 없으므로 먼저 실행)

```sql
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
    include_portfolio    BOOLEAN DEFAULT false,   -- 견적서에 포트폴리오 첨부 여부
    is_default           BOOLEAN DEFAULT false,
    created_at           TIMESTAMPTZ DEFAULT now()
);

-- ② clients (거래처)
CREATE TABLE public.clients (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             TEXT NOT NULL,
    business_number  TEXT,
    files            JSONB DEFAULT '[]',
    -- contacts 구조: [{name, role, dept, phone, email}, ...]
    contacts         JSONB DEFAULT '[]',
    created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_clients_name ON public.clients(name);
```

### 1-B. 기존 `projects` 테이블 ERP 스펙으로 교체

> ⚠️ FK 제약 때문에 순서 엄수. DROP → 재생성 → FK 복원.

```sql
-- ① transactions의 FK 제약 임시 제거
ALTER TABLE public.transactions
    DROP CONSTRAINT IF EXISTS transactions_project_id_fkey;

-- ② 기존 projects 테이블 제거
--    (기존 projects 데이터는 아직 없거나, 가계부용 더미 데이터만 있음 — 버려도 됨)
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
    -- 프로젝트 상태 ('active' = 진행 중인 프로젝트, 칸반 표시 기준)
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
```

### 1-C. 나머지 신규 테이블 (projects에 의존)

```sql
-- ① project_incomes (수입 파이프라인 / 칸반 카드)
CREATE TABLE public.project_incomes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id              UUID NOT NULL
                            REFERENCES public.projects(id) ON DELETE CASCADE,
    title                   TEXT NOT NULL,   -- '선금', '잔금', '계약금' 등
    amount                  NUMERIC NOT NULL DEFAULT 0,
    expected_date           DATE,            -- 입금 예정일 / 마감일
    status                  TEXT NOT NULL DEFAULT '의뢰중'
                            CHECK (status IN (
                                '의뢰중', '작업중', '보류취소',
                                '작업완료', '수정완료',
                                '입금대기', '입금완료', '포스팅완료'
                            )),
    matched_transaction_id  UUID,            -- 입금 매칭 후 채움
    created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_project_incomes_project_id ON public.project_incomes(project_id);
CREATE INDEX idx_project_incomes_status     ON public.project_incomes(status);

-- ② daily_rate_logs (광준 퍼스트 일당)
--   ⚠️ withholding_rate DEFAULT 0:
--      광준 본인은 세금계산서 발행 → 원천징수 없음.
--      3.3%는 crew_payments(크루원 지급)에서만 적용.
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
--   ⚠️ amount_net을 GENERATED COLUMN으로 통일 (daily_rate_logs와 동일 방식)
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
```

### 1-D. RLS 정책

```sql
-- 모든 신규 ERP 테이블에 RLS 활성화
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
```

### 1-E. 시드 데이터

```sql
-- 자사 프로필 3개
INSERT INTO public.business_profiles
    (owner_type, business_name, representative_name, is_default, include_portfolio)
VALUES
    ('kwangjun', '정광준',          '정광준',          true, true),
    ('euiyoung', '송의영',          '송의영',          true, false),
    ('joint',    '스튜디오 (미확정)', '정광준·송의영',   true, true);

-- 기본 거래처
INSERT INTO public.clients (name, contacts) VALUES
    ('스튜디오리프',          '[]'),
    ('기브온',               '[]'),
    ('그립두드',             '[]'),
    ('한국 다이이치산쿄',     '[]');
```

---

## Step 2: `database.types.ts` 갱신

마이그레이션 실행 후 터미널에서:

```bash
# project-id는 Supabase 대시보드 Settings > General에서 확인
npx supabase gen types typescript \
  --project-id <your-project-id> \
  --schema public \
  > src/shared/api/supabase/database.types.ts
```

> 이 파일을 직접 수동 편집하지 말 것. CLI 자동 생성 파일입니다.

---

## Step 3: 공통 상수 파일

**신규 생성:** `src/shared/constants/business.ts`

```typescript
// ─── 사업 주체 ───────────────────────────────────────────────
export const OWNER_TYPES = ['kwangjun', 'euiyoung', 'joint'] as const;
export type OwnerType = typeof OWNER_TYPES[number];

export const OWNER_LABELS: Record<OwnerType, string> = {
  kwangjun: '광준',
  euiyoung: '의영',
  joint:    '공동',
};

/** 칸반 카드 헤더 컬러 (Tailwind bg 클래스) */
export const OWNER_COLORS: Record<OwnerType, string> = {
  kwangjun: 'bg-blue-500',    // 🟦
  euiyoung: 'bg-green-500',   // 🟩
  joint:    'bg-purple-500',  // 🟪
};

// ─── 수입 유형 ───────────────────────────────────────────────
export const INCOME_TYPES = ['freelance', 'daily_rate', 'photo_project'] as const;
export type IncomeType = typeof INCOME_TYPES[number];

export const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  freelance:     '프리랜서 계약',
  daily_rate:    '퍼스트 일당',
  photo_project: '사진 프로젝트',
};

// ─── 칸반 상태 (파이프라인 순서 그대로) ─────────────────────
export const PIPELINE_STATUSES = [
  '의뢰중',
  '작업중',
  '보류취소',
  '작업완료',
  '수정완료',
  '입금대기',
  '입금완료',
  '포스팅완료',
] as const;
export type PipelineStatus = typeof PIPELINE_STATUSES[number];

// ─── 프로젝트 카테고리 태그 ──────────────────────────────────
export const PROJECT_CATEGORIES = [
  '영상조명', '영상스케치', '사진조명',
  '조명_퍼스트', '조명_프리랜서',
  '그래픽디자인', '공간디자인', '모션그래픽',
  '사진촬영_공동', '중계',
] as const;
export type ProjectCategory = typeof PROJECT_CATEGORIES[number];

// ─── 진행비 카테고리 ─────────────────────────────────────────
export const EXPENSE_CATEGORIES = ['주차비', '주유비', '톨비', '식비', '기타'] as const;
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

// ─── 크루원 역할 ─────────────────────────────────────────────
export const CREW_ROLES = ['세컨', '서드', '막내', '기타'] as const;
export type CrewRole = typeof CREW_ROLES[number];
```

---

## Step 4: entities 레이어

### 4-A. `src/entities/client/`

**`model/types.ts`**
```typescript
export interface Contact {
  name:   string;
  role?:  string;
  dept?:  string;
  phone?: string;
  email?: string;
}

export interface Client {
  id:              string;
  name:            string;
  business_number?: string;
  files:           string[];
  contacts:        Contact[];
  created_at:      string;
  // 집계값 (쿼리 조인으로 계산)
  total_revenue?:  number;
  project_count?:  number;
  last_project_at?: string;
}
```

**`api/get-clients.ts`**
```typescript
'use server'
import { createClient } from '@/shared/api/supabase/server';
import type { Client } from '../model/types';

export async function getClients(): Promise<Client[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name');
  if (error) throw error;
  return data as Client[];
}
```

**`api/upsert-client.ts`**
```typescript
'use server'
import { createClient } from '@/shared/api/supabase/server';
import type { Client } from '../model/types';

export async function upsertClient(
  payload: Omit<Client, 'created_at' | 'total_revenue' | 'project_count' | 'last_project_at'>
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clients')
    .upsert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}
```

**`index.ts`**
```typescript
export * from './model/types';
export * from './api/get-clients';
export * from './api/upsert-client';
```

---

### 4-B. `src/entities/project/`

**`model/types.ts`**
```typescript
import type { OwnerType, IncomeType, PipelineStatus } from '@/shared/constants/business';

export interface Project {
  id:              string;
  name:            string;
  client_id?:      string;
  business_owner:  OwnerType;
  income_type:     IncomeType;
  categories:      string[];
  status:          'active' | 'completed' | 'cancelled';
  duration_days?:  number;
  start_date?:     string;
  end_date?:       string;
  created_at:      string;
  // 조인
  client?:         { id: string; name: string };
}

export interface ProjectIncome {
  id:                      string;
  project_id:              string;
  title:                   string;
  amount:                  number;
  expected_date?:          string;
  status:                  PipelineStatus;
  matched_transaction_id?: string;
  created_at:              string;
  // 조인
  project?:                Project;
}
```

**`api/get-projects.ts`**
```typescript
'use server'
import { createClient } from '@/shared/api/supabase/server';
import type { Project } from '../model/types';

export async function getProjects(status?: 'active' | 'completed' | 'cancelled'): Promise<Project[]> {
  const supabase = await createClient();
  let query = supabase
    .from('projects')
    .select('*, client:clients(id, name)')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data as Project[];
}
```

**`api/get-pipeline.ts`** ← 칸반 보드용 전용 쿼리
```typescript
'use server'
import { createClient } from '@/shared/api/supabase/server';
import type { ProjectIncome } from '../model/types';
import type { OwnerType } from '@/shared/constants/business';

export async function getPipelineIncomes(
  ownerFilter?: OwnerType | 'all'
): Promise<ProjectIncome[]> {
  const supabase = await createClient();

  let query = supabase
    .from('project_incomes')
    .select(`
      *,
      project:projects (
        id, name, business_owner, categories, status,
        client:clients(id, name)
      )
    `)
    .order('expected_date', { ascending: true, nullsFirst: false });

  // active 프로젝트만 (보류취소는 칸반에서 접어서 표시)
  query = query.eq('project.status', 'active');

  if (ownerFilter && ownerFilter !== 'all') {
    query = query.eq('project.business_owner', ownerFilter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as ProjectIncome[];
}
```

**`api/update-income-status.ts`** ← 칸반 드래그앤드롭 저장
```typescript
'use server'
import { createClient } from '@/shared/api/supabase/server';
import type { PipelineStatus } from '@/shared/constants/business';

export async function updateIncomeStatus(id: string, status: PipelineStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('project_incomes')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}
```

---

### 4-C. `src/entities/daily-rate/`

**`model/types.ts`**
```typescript
export interface DailyRateLog {
  id:                      string;
  user_id?:                string;
  client_id?:              string;
  work_date:               string;
  site_name:               string;
  amount_gross:            number;
  withholding_rate:        number;   // 광준 본인: 0
  amount_net:              number;   // DB GENERATED
  payment_status:          'pending' | 'paid';
  payment_date?:           string;
  matched_transaction_id?: string;
  created_at:              string;
  // 조인
  client?:         { id: string; name: string };
  crew_payments?:  CrewPayment[];
  site_expenses?:  SiteExpense[];
}

export interface CrewPayment {
  id:                string;
  daily_rate_log_id: string;
  crew_name:         string;
  role?:             string;
  amount_gross:      number;
  withholding_rate:  number;
  amount_net:        number;   // DB GENERATED
  account_info?:     string;
  paid:              boolean;
  paid_date?:        string;
}

export interface SiteExpense {
  id:                  string;
  daily_rate_log_id:   string;
  category:            string;
  amount:              number;
  memo?:               string;
  receipt_url?:        string;
  included_in_invoice: boolean;
}

/** 거래처 청구 총액 계산 (프론트 유틸) */
export function calcInvoiceTotal(log: DailyRateLog): number {
  const crew    = (log.crew_payments ?? []).reduce((s, c) => s + c.amount_gross, 0);
  const expense = (log.site_expenses ?? [])
    .filter(e => e.included_in_invoice)
    .reduce((s, e) => s + e.amount, 0);
  return log.amount_gross + crew + expense;
}
```

**`api/get-daily-logs.ts`**
```typescript
'use server'
import { createClient } from '@/shared/api/supabase/server';
import type { DailyRateLog } from '../model/types';

/** 월별 일당 로그 조회 (YYYY-MM 형식) */
export async function getDailyRateLogs(yearMonth?: string): Promise<DailyRateLog[]> {
  const supabase = await createClient();
  let query = supabase
    .from('daily_rate_logs')
    .select(`
      *,
      client:clients(id, name),
      crew_payments(*),
      site_expenses(*)
    `)
    .order('work_date', { ascending: false });

  if (yearMonth) {
    query = query
      .gte('work_date', `${yearMonth}-01`)
      .lt('work_date', getNextMonth(yearMonth));
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as DailyRateLog[];
}

function getNextMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number);
  return m === 12
    ? `${y + 1}-01-01`
    : `${y}-${String(m + 1).padStart(2, '0')}-01`;
}
```

**`api/create-daily-log.ts`** ← 빠른 입력 모달 저장
```typescript
'use server'
import { createClient } from '@/shared/api/supabase/server';
import type { DailyRateLog, CrewPayment, SiteExpense } from '../model/types';

interface CreateDailyLogInput {
  log:      Omit<DailyRateLog, 'id' | 'amount_net' | 'created_at' | 'client' | 'crew_payments' | 'site_expenses'>;
  crew?:    Omit<CrewPayment, 'id' | 'daily_rate_log_id' | 'amount_net'>[];
  expenses?: Omit<SiteExpense, 'id' | 'daily_rate_log_id'>[];
}

export async function createDailyLog({ log, crew = [], expenses = [] }: CreateDailyLogInput) {
  const supabase = await createClient();

  // 1. daily_rate_logs 삽입
  const { data: logData, error: logError } = await supabase
    .from('daily_rate_logs')
    .insert(log)
    .select('id')
    .single();
  if (logError) throw logError;

  const logId = logData.id;

  // 2. crew_payments 일괄 삽입
  if (crew.length > 0) {
    const { error } = await supabase.from('crew_payments').insert(
      crew.map(c => ({ ...c, daily_rate_log_id: logId }))
    );
    if (error) throw error;
  }

  // 3. site_expenses 일괄 삽입
  if (expenses.length > 0) {
    const { error } = await supabase.from('site_expenses').insert(
      expenses.map(e => ({ ...e, daily_rate_log_id: logId }))
    );
    if (error) throw error;
  }

  return logId;
}
```

---

## Step 5: features 레이어

### 5-A. `src/features/log-daily-rate/` — 일당 빠른 입력 모달

**트리거:** FAB "+" 버튼 클릭 (모바일/PC 공통)
**UI 형태:** Bottom Sheet (모바일) / Center Modal (PC) — Radix Dialog 활용

**`ui/LogDailyRateModal.tsx`**

```tsx
'use client'
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { createDailyLog } from '@/entities/daily-rate/api/create-daily-log';
import { CREW_ROLES, EXPENSE_CATEGORIES } from '@/shared/constants/business';
import type { CrewPayment, SiteExpense } from '@/entities/daily-rate/model/types';

interface Props { open: boolean; onClose: () => void; onSuccess: () => void; }

export function LogDailyRateModal({ open, onClose, onSuccess }: Props) {
  // ─── 기본 필드 ────────────────────────────────────────────
  const [workDate,    setWorkDate]    = useState(today());
  const [clientId,    setClientId]    = useState('');
  const [siteName,    setSiteName]    = useState('');
  const [amountGross, setAmountGross] = useState('');

  // ─── 크루원 (접이식) ──────────────────────────────────────
  const [showCrew, setShowCrew] = useState(false);
  const [crew, setCrew] = useState<Omit<CrewPayment, 'id'|'daily_rate_log_id'|'amount_net'>[]>([]);

  // ─── 진행비 (접이식) ──────────────────────────────────────
  const [showExpenses, setShowExpenses] = useState(false);
  const [expenses, setExpenses] = useState<Omit<SiteExpense, 'id'|'daily_rate_log_id'>[]>([]);

  // 실수령액 프리뷰 (광준 withholding_rate = 0이므로 동일)
  const netPreview = Number(amountGross) || 0;

  async function handleSubmit() {
    await createDailyLog({
      log: {
        work_date:       workDate,
        client_id:       clientId || undefined,
        site_name:       siteName,
        amount_gross:    Number(amountGross),
        withholding_rate: 0,
        payment_status:  'pending',
      },
      crew,
      expenses,
    });
    onSuccess();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>📸 일당 기록</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* 기본 3개 필드 */}
          <Input type="date"   value={workDate}    onChange={e => setWorkDate(e.target.value)}    placeholder="날짜" />
          {/* TODO: ClientSelect 컴포넌트 (clients 조회 combobox) */}
          <Input type="text"   value={siteName}    onChange={e => setSiteName(e.target.value)}    placeholder="현장명 (예: 현대차 CF)" />
          <div className="relative">
            <Input type="number" value={amountGross} onChange={e => setAmountGross(e.target.value)} placeholder="일당 금액 (세전)" />
            {netPreview > 0 && (
              <p className="mt-1 text-xs text-gray-500">실수령: ₩{netPreview.toLocaleString()} (세금계산서 발행)</p>
            )}
          </div>

          {/* 크루원 토글 섹션 */}
          <button
            type="button"
            className="text-sm text-blue-600 hover:underline"
            onClick={() => setShowCrew(v => !v)}
          >
            {showCrew ? '▲ 크루원 닫기' : '▼ 크루원 추가'}
          </button>
          {showCrew && <CrewSection crew={crew} onChange={setCrew} />}

          {/* 진행비 토글 섹션 */}
          <button
            type="button"
            className="text-sm text-blue-600 hover:underline"
            onClick={() => setShowExpenses(v => !v)}
          >
            {showExpenses ? '▲ 진행비 닫기' : '▼ 진행비 추가'}
          </button>
          {showExpenses && <ExpenseSection expenses={expenses} onChange={setExpenses} />}

          {/* 거래처 청구 총액 프리뷰 */}
          {(crew.length > 0 || expenses.length > 0) && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <p className="font-medium text-gray-700">거래처 청구 총액 예상</p>
              <p className="text-lg font-bold text-gray-900">
                ₩{calcInvoiceTotalPreview(Number(amountGross), crew, expenses).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">취소</Button>
          <Button onClick={handleSubmit} className="flex-1" disabled={!siteName || !amountGross}>저장</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── 내부 헬퍼 ──────────────────────────────────────────────────
function today() { return new Date().toISOString().split('T')[0]; }

function calcInvoiceTotalPreview(
  gross: number,
  crew: { amount_gross: number }[],
  expenses: { amount: number; included_in_invoice: boolean }[]
): number {
  return gross
    + crew.reduce((s, c) => s + c.amount_gross, 0)
    + expenses.filter(e => e.included_in_invoice).reduce((s, e) => s + e.amount, 0);
}

// ── 크루원 입력 섹션 ─────────────────────────────────────────
function CrewSection({ crew, onChange }: {
  crew: Omit<CrewPayment, 'id'|'daily_rate_log_id'|'amount_net'>[];
  onChange: (v: typeof crew) => void;
}) {
  function addRow() {
    onChange([...crew, { crew_name: '', role: '세컨', amount_gross: 0, withholding_rate: 3.3, paid: false }]);
  }
  return (
    <div className="space-y-2 rounded-lg border p-3">
      {crew.map((c, i) => (
        <div key={i} className="flex gap-2">
          <Input value={c.crew_name} onChange={e => {
            const next = [...crew]; next[i] = { ...c, crew_name: e.target.value }; onChange(next);
          }} placeholder="이름" className="flex-1" />
          <select className="rounded border px-2 text-sm" value={c.role ?? '세컨'}
            onChange={e => { const next = [...crew]; next[i] = { ...c, role: e.target.value }; onChange(next); }}>
            {CREW_ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
          <Input type="number" value={c.amount_gross || ''} onChange={e => {
            const next = [...crew]; next[i] = { ...c, amount_gross: Number(e.target.value) }; onChange(next);
          }} placeholder="금액" className="w-24" />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRow}>+ 크루원 추가</Button>
    </div>
  );
}

// ── 진행비 입력 섹션 ─────────────────────────────────────────
function ExpenseSection({ expenses, onChange }: {
  expenses: Omit<SiteExpense, 'id'|'daily_rate_log_id'>[];
  onChange: (v: typeof expenses) => void;
}) {
  function addRow() {
    onChange([...expenses, { category: '주차비', amount: 0, included_in_invoice: true }]);
  }
  return (
    <div className="space-y-2 rounded-lg border p-3">
      {expenses.map((e, i) => (
        <div key={i} className="flex gap-2">
          <select className="rounded border px-2 text-sm" value={e.category}
            onChange={ev => { const next = [...expenses]; next[i] = { ...e, category: ev.target.value }; onChange(next); }}>
            {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <Input type="number" value={e.amount || ''} onChange={ev => {
            const next = [...expenses]; next[i] = { ...e, amount: Number(ev.target.value) }; onChange(next);
          }} placeholder="금액" className="flex-1" />
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" checked={e.included_in_invoice}
              onChange={ev => { const next = [...expenses]; next[i] = { ...e, included_in_invoice: ev.target.checked }; onChange(next); }} />
            계산서 포함
          </label>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRow}>+ 진행비 추가</Button>
    </div>
  );
}
```

---

### 5-B. `src/features/manage-pipeline/` — 칸반 드래그앤드롭

**필요 패키지 설치:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**`ui/PipelineKanban.tsx`** — 구조 뼈대만 명시, 구현은 dnd-kit 문서 참고

```tsx
'use client'
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { PIPELINE_STATUSES, OWNER_COLORS, OWNER_LABELS } from '@/shared/constants/business';
import { updateIncomeStatus } from '@/entities/project/api/update-income-status';
import type { ProjectIncome } from '@/entities/project/model/types';
import type { OwnerType } from '@/shared/constants/business';

interface Props {
  incomes: ProjectIncome[];
  ownerFilter: OwnerType | 'all';
  onRefresh: () => void;
}

export function PipelineKanban({ incomes, ownerFilter, onRefresh }: Props) {
  const filtered = ownerFilter === 'all'
    ? incomes
    : incomes.filter(i => i.project?.business_owner === ownerFilter);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // over.id = 드롭된 컬럼의 status 값
    await updateIncomeStatus(String(active.id), over.id as any);
    onRefresh();
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STATUSES.map(status => {
          const cards = filtered.filter(i => i.status === status);
          // 보류취소 컬럼은 기본 접힌 상태로 구현 권장
          const isArchive = status === '보류취소';
          return (
            <KanbanColumn
              key={status}
              status={status}
              cards={cards}
              isCollapsed={isArchive}
            />
          );
        })}
      </div>
    </DndContext>
  );
}
```

**`KanbanCard` UI 스펙:**
```
┌─────────────────────────────┐
│ ████ (owner 색상 4px 상단 바) │
│ 프로젝트명 (bold)             │
│ 거래처명  ·  카테고리 태그    │
│ 마감일: XX월 XX일            │
│ ₩X,XXX,XXX                  │
└─────────────────────────────┘
```
- 카드 클릭 → Detail Modal (프로젝트 전체 정보 + 금액 편집)
- 사업 주체 컬러바: `OWNER_COLORS[project.business_owner]`

---

## Step 6: widgets 레이어

### 6-A. `src/widgets/income-kanban/`

```tsx
// ui/IncomeKanbanWidget.tsx
'use client'
import { useState, useEffect } from 'react';
import { getPipelineIncomes } from '@/entities/project/api/get-pipeline';
import { PipelineKanban } from '@/features/manage-pipeline/ui/PipelineKanban';
import { OWNER_TYPES, OWNER_LABELS } from '@/shared/constants/business';
import type { OwnerType } from '@/shared/constants/business';
import type { ProjectIncome } from '@/entities/project/model/types';

export function IncomeKanbanWidget() {
  const [filter, setFilter]   = useState<OwnerType | 'all'>('all');
  const [incomes, setIncomes] = useState<ProjectIncome[]>([]);

  async function load() {
    setIncomes(await getPipelineIncomes());
  }
  useEffect(() => { load(); }, []);

  return (
    <div>
      {/* 사업 주체 필터 탭 */}
      <div className="mb-4 flex gap-2">
        {(['all', ...OWNER_TYPES] as const).map(o => (
          <button
            key={o}
            onClick={() => setFilter(o)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition
              ${filter === o ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            {o === 'all' ? '전체' : OWNER_LABELS[o]}
          </button>
        ))}
      </div>

      <PipelineKanban incomes={incomes} ownerFilter={filter} onRefresh={load} />
    </div>
  );
}
```

### 6-B. `src/widgets/cashflow-calendar/`

**데이터 통합 로직:**
1. `project_incomes`에서 `expected_date` + `amount` + `status` IN ('입금대기', '입금완료') 조회
2. `daily_rate_logs`에서 `payment_date` + `amount_gross` + `payment_status = 'pending'` 조회
3. `transactions`에서 `type = 'expense'` + `category.is_business_only = true` 조회
4. 날짜별 합산 → 입금(+) / 지출(-) / 누적 가용 현금 계산

```typescript
// api/get-cashflow-events.ts (Server Action)
export interface CashflowEvent {
  date:    string;
  label:   string;
  amount:  number;
  type:    'income' | 'expense';
  source:  'pipeline' | 'daily_rate' | 'transaction';
}
```

### 6-C. `src/widgets/client-list/`

```tsx
// 테이블 컬럼 구성
const COLUMNS = [
  { key: 'name',            label: '업체명' },
  { key: 'project_count',   label: '프로젝트' },
  { key: 'total_revenue',   label: '누적 매출' },
  { key: 'last_project_at', label: '최근 거래일' },
  { key: 'actions',         label: '' },
];
// 행 클릭 → 우측 사이드 패널 슬라이드 (담당자 관리 + 프로젝트 이력)
```

---

## Step 7: pages 라우트 생성

아래 파일을 **신규 생성**합니다.

### 7-A. 비즈니스 레이아웃
**`src/app/business/layout.tsx`**
```tsx
export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  // 기존 Header 위젯 재사용 + Business 전용 서브 네비 추가
  return (
    <div>
      {/* TODO: 비즈니스 서브 네비 (파이프라인 | 일당 로그 | 거래처 | 설정) */}
      {children}
    </div>
  );
}
```

### 7-B. 파이프라인 (칸반) 페이지
**`src/app/business/pipeline/page.tsx`**
```tsx
import { IncomeKanbanWidget } from '@/widgets/income-kanban/ui/IncomeKanbanWidget';
export default function PipelinePage() {
  return (
    <main className="p-4">
      <h1 className="mb-6 text-2xl font-bold">수입 파이프라인</h1>
      <IncomeKanbanWidget />
    </main>
  );
}
```

### 7-C. 일당 로그 페이지
**`src/app/business/daily-log/page.tsx`**
```tsx
'use client'
import { useState } from 'react';
import { LogDailyRateModal } from '@/features/log-daily-rate/ui/LogDailyRateModal';
// + 월별 로그 테이블 (getDailyRateLogs 데이터)
export default function DailyLogPage() {
  const [open, setOpen] = useState(false);
  return (
    <main className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">퍼스트 일당 로그</h1>
        <button onClick={() => setOpen(true)} className="rounded-full bg-blue-600 px-4 py-2 text-sm text-white">
          + 기록 추가
        </button>
      </div>
      {/* TODO: 월별 요약 카드 + 로그 테이블 */}
      <LogDailyRateModal open={open} onClose={() => setOpen(false)} onSuccess={() => {}} />
    </main>
  );
}
```

### 7-D. 거래처 페이지
**`src/app/business/clients/page.tsx`**
```tsx
import { ClientListWidget } from '@/widgets/client-list/ui/ClientListWidget';
export default function ClientsPage() {
  return (
    <main className="p-4">
      <h1 className="mb-6 text-2xl font-bold">거래처 관리</h1>
      <ClientListWidget />
    </main>
  );
}
```

### 7-E. 비즈니스 설정 페이지
**`src/app/business/settings/page.tsx`**
```tsx
// business_profiles 3개 (광준/의영/공동) 편집 폼
// 각 프로필: 상호, 사업자번호, 계좌, 포트폴리오 URL, include_portfolio 토글
```

---

## Step 8: 주요 Supabase 쿼리 참고

### 거래처별 LTV 집계
```sql
SELECT
  c.id, c.name,
  COUNT(DISTINCT p.id)        AS project_count,
  COALESCE(SUM(pi.amount), 0) AS total_revenue,
  MAX(p.end_date)             AS last_project_date
FROM public.clients c
LEFT JOIN public.projects p       ON p.client_id = c.id
LEFT JOIN public.project_incomes pi
  ON pi.project_id = p.id AND pi.status = '입금완료'
GROUP BY c.id, c.name
ORDER BY total_revenue DESC;
```

### 월별 일당 + 진행비 청구 합산
```sql
SELECT
  DATE_TRUNC('month', drl.work_date) AS month,
  COUNT(*)                            AS total_days,
  SUM(drl.amount_gross)               AS total_gross,
  SUM(drl.amount_gross)
    + COALESCE((
        SELECT SUM(cp.amount_gross)
        FROM public.crew_payments cp
        WHERE cp.daily_rate_log_id = drl.id
    ), 0)
    + COALESCE((
        SELECT SUM(se.amount)
        FROM public.site_expenses se
        WHERE se.daily_rate_log_id = drl.id
          AND se.included_in_invoice = true
    ), 0)                             AS invoice_total
FROM public.daily_rate_logs drl
GROUP BY DATE_TRUNC('month', drl.work_date)
ORDER BY month DESC;
```

### 사업 주체별 수입 요약
```sql
SELECT
  p.business_owner,
  DATE_TRUNC('month', pi.expected_date) AS month,
  SUM(pi.amount)                         AS total_income
FROM public.project_incomes pi
JOIN public.projects p ON pi.project_id = p.id
WHERE pi.status IN ('입금대기', '입금완료')
GROUP BY p.business_owner, DATE_TRUNC('month', pi.expected_date)
ORDER BY month DESC;
```

---

## 구현 순서 요약

```
① Step 1-A → SQL 실행 (business_profiles, clients 신규)
② Step 1-B → SQL 실행 (projects 교체 — FK 처리 포함)
③ Step 1-C → SQL 실행 (project_incomes, daily_rate_logs, crew_payments, site_expenses)
④ Step 1-D → RLS 정책 적용
⑤ Step 1-E → 시드 데이터 삽입
⑥ Step 2  → database.types.ts CLI 재생성
⑦ Step 3  → shared/constants/business.ts 생성
⑧ Step 4  → entities (client, project, daily-rate) 생성
⑨ Step 5  → features (log-daily-rate 먼저, manage-pipeline 다음)
⑩ Step 6  → widgets (income-kanban 먼저, cashflow-calendar 나중)
⑪ Step 7  → pages (/business/* 라우트)
```

---

## ✅ 테스트 체크리스트

**DB:**
- [ ] `projects` 테이블 재생성 후 `transactions.project_id` FK 정상 작동
- [ ] `crew_payments.amount_net` GENERATED COLUMN 자동 계산 (amount_gross=100, rate=3.3 → net=96.7)
- [ ] `daily_rate_logs.amount_net` GENERATED COLUMN (withholding_rate=0 → net=gross)
- [ ] `project_incomes.status` CHECK constraint: 없는 값 삽입 시 에러

**기능:**
- [ ] 일당 기록 저장 → `daily_rate_logs` + `crew_payments` + `site_expenses` 동시 삽입
- [ ] 칸반 카드 드래그 → `project_incomes.status` 변경 DB 반영
- [ ] 사업 주체 필터 (광준 선택 시 광준 프로젝트만 표시)
- [ ] 거래처 LTV 집계 쿼리 정상 동작

**기존 기능 회귀 방지:**
- [ ] 기존 가계부 `/` 대시보드 정상 렌더링
- [ ] `/manage/import` 엑셀 임포트 정상 동작
- [ ] `/transactions/unclassified` 미분류 정리 정상 동작
