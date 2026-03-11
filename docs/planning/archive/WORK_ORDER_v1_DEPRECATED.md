# 📋 Business ERP Phase 4 — 작업명세서 (Work Order)

> **작성일:** 2026-03-05
> **기준 문서:** `ERP_DESIGN.md` + `TECHNICAL_SPECIFICATION.md`
> **수신:** Antigravity
> **목적:** 이 문서의 순서대로 따라가면 Phase 4가 완전히 구현됩니다.

---

## ⚠️ 검토 결과 — 발견된 문제 (수정 완료)

두 문서를 교차 검토한 결과 아래 9개의 불일치/누락이 발견되었습니다. 이 명세서에는 수정된 최종 버전이 반영되어 있습니다.

| # | 위치 | 문제 | 수정 내용 |
|---|------|------|-----------|
| 1 | `daily_rate_logs.withholding_rate` | DEFAULT 3.3인데, 광준 본인은 세금계산서 발행 → 원천징수 없음 | **DEFAULT 0** 으로 수정 |
| 2 | `daily_rate_logs` | `user_id` 컬럼 누락 (ERP_DESIGN에 명시, TECHNICAL에 없음) | **컬럼 추가** |
| 3 | `crew_payments` | 필드명 불일치: `name` vs `crew_name`, `is_paid` vs `paid` | **ERP_DESIGN 기준** `crew_name`, `paid` 로 통일 |
| 4 | `crew_payments.amount_net` | `daily_rate_logs`는 GENERATED COLUMN인데 crew_payments는 일반 컬럼 | **GENERATED ALWAYS AS** 로 통일 |
| 5 | `business_profiles` | ERP_DESIGN에 명시된 `include_portfolio` 옵션 컬럼 누락 | **`include_portfolio BOOLEAN`** 추가 |
| 6 | `project_incomes.status` | 8개 상태값 정의되었으나 CHECK 제약 없음 | **CHECK constraint** 추가 |
| 7 | `transactions` 테이블 | ERP_DESIGN에 `project_id` FK 추가 명시, TECHNICAL에 누락 | **ALTER TABLE** 추가 |
| 8 | RLS 정책 | "RLS 설정 필요" 언급만 있고 실제 SQL 없음 | **전체 RLS SQL** 작성 |
| 9 | 시드 데이터 | ERP_DESIGN에 기본 거래처 명시, SQL 없음 | **INSERT 시드 데이터** 추가 |

---

## 📁 Phase 4 구현 순서

```
Step 1: DB Migration (Supabase SQL)
Step 2: RLS 정책 적용
Step 3: 시드 데이터 삽입
Step 4: FSD 폴더 구조 세팅
Step 5: entities 레이어 (타입/API)
Step 6: features 레이어 (비즈니스 로직)
Step 7: widgets 레이어 (UI 컴포넌트)
Step 8: pages 레이어 (라우팅 연결)
```

---

## Step 1: DB Migration SQL

Supabase Dashboard → SQL Editor 에서 아래 SQL을 **순서대로** 실행합니다.

### 1-A. UUID Extension 활성화 (이미 되어있으면 SKIP)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 1-B. `business_profiles` 테이블

```sql
CREATE TABLE public.business_profiles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_type      TEXT NOT NULL CHECK (owner_type IN ('kwangjun', 'euiyoung', 'joint')),
    business_name   TEXT NOT NULL,
    representative_name TEXT NOT NULL,
    business_number TEXT,
    address         TEXT,
    bank_name       TEXT,
    account_number  TEXT,
    portfolio_url   TEXT,
    intro_document_url TEXT,
    include_portfolio  BOOLEAN DEFAULT false,  -- 견적서에 포트폴리오 첨부 여부
    is_default      BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now()
);
```

### 1-C. `clients` 테이블

```sql
CREATE TABLE public.clients (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    business_number TEXT,
    files           JSONB DEFAULT '[]',
    -- contacts 구조: [{name, role, phone, email, dept}, ...]
    contacts        JSONB DEFAULT '[]',
    created_at      TIMESTAMPTZ DEFAULT now()
);
```

### 1-D. `projects` 테이블

```sql
CREATE TABLE public.projects (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    client_id       UUID REFERENCES public.clients(id),
    business_owner  TEXT NOT NULL CHECK (business_owner IN ('kwangjun', 'euiyoung', 'joint')),
    income_type     TEXT NOT NULL CHECK (income_type IN ('freelance', 'daily_rate', 'photo_project')),
    -- 표준 태그: 영상조명, 영상스케치, 사진조명, 조명_퍼스트, 조명_프리랜서,
    --            그래픽디자인, 공간디자인, 모션그래픽, 사진촬영_공동, 중계
    categories      TEXT[] DEFAULT '{}',
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'completed', 'cancelled')),
    duration_days   NUMERIC,
    start_date      DATE,
    end_date        DATE,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_projects_client_id       ON public.projects(client_id);
CREATE INDEX idx_projects_business_owner  ON public.projects(business_owner);
CREATE INDEX idx_projects_status          ON public.projects(status);
```

### 1-E. `project_incomes` 테이블 (칸반 카드)

```sql
CREATE TABLE public.project_incomes (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id              UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title                   TEXT NOT NULL,  -- '선금', '잔금', '계약금' 등
    amount                  NUMERIC NOT NULL DEFAULT 0,
    expected_date           DATE,           -- 입금 예정일 / 마감일
    status                  TEXT NOT NULL DEFAULT '의뢰중'
                            CHECK (status IN (
                                '의뢰중',
                                '작업중',
                                '보류취소',
                                '작업완료',
                                '수정완료',
                                '입금대기',
                                '입금완료',
                                '포스팅완료'
                            )),
    matched_transaction_id  UUID,           -- 입금 매칭 후 채움 (transactions 테이블 FK)
    created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_project_incomes_project_id ON public.project_incomes(project_id);
CREATE INDEX idx_project_incomes_status     ON public.project_incomes(status);
```

### 1-F. `daily_rate_logs` 테이블 (광준 퍼스트 일당)

> ⚠️ **수정 포인트:** `withholding_rate DEFAULT 0` — 광준 본인은 세금계산서 발행이므로 원천징수 없음.
> 3.3%는 크루원 지급(crew_payments)에서만 적용.

```sql
CREATE TABLE public.daily_rate_logs (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID REFERENCES auth.users(id),  -- RLS용
    client_id               UUID REFERENCES public.clients(id),
    work_date               DATE NOT NULL,
    site_name               TEXT NOT NULL,  -- 현장명/작품명 (예: "현대차 CF")
    amount_gross            NUMERIC NOT NULL,  -- 세전 금액
    withholding_rate        NUMERIC DEFAULT 0,  -- 광준 본인: 0 (세금계산서 발행)
    amount_net              NUMERIC GENERATED ALWAYS AS
                            (amount_gross * (1 - withholding_rate / 100)) STORED,
    payment_status          TEXT DEFAULT 'pending'
                            CHECK (payment_status IN ('pending', 'paid')),
    payment_date            DATE,
    matched_transaction_id  UUID,
    created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_daily_rate_logs_client_id  ON public.daily_rate_logs(client_id);
CREATE INDEX idx_daily_rate_logs_work_date  ON public.daily_rate_logs(work_date);
CREATE INDEX idx_daily_rate_logs_user_id    ON public.daily_rate_logs(user_id);
```

### 1-G. `crew_payments` 테이블 (크루원 인건비)

> ⚠️ **수정 포인트:** 필드명 `crew_name`, `paid` 사용 (ERP_DESIGN 기준).
> `amount_net` GENERATED COLUMN으로 통일.

```sql
CREATE TABLE public.crew_payments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_rate_log_id   UUID NOT NULL REFERENCES public.daily_rate_logs(id) ON DELETE CASCADE,
    crew_name           TEXT NOT NULL,
    role                TEXT,  -- '세컨', '서드', '막내', '기타'
    amount_gross        NUMERIC NOT NULL,
    withholding_rate    NUMERIC DEFAULT 3.3,  -- 크루원에게는 3.3% 적용
    amount_net          NUMERIC GENERATED ALWAYS AS
                        (amount_gross * (1 - withholding_rate / 100)) STORED,
    account_info        TEXT,
    paid                BOOLEAN DEFAULT false,
    paid_date           DATE
);

CREATE INDEX idx_crew_payments_daily_rate_log_id ON public.crew_payments(daily_rate_log_id);
```

### 1-H. `site_expenses` 테이블 (현장 진행비)

```sql
CREATE TABLE public.site_expenses (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_rate_log_id   UUID NOT NULL REFERENCES public.daily_rate_logs(id) ON DELETE CASCADE,
    category            TEXT NOT NULL
                        CHECK (category IN ('주차비', '주유비', '톨비', '식비', '기타')),
    amount              NUMERIC NOT NULL,
    memo                TEXT,
    receipt_url         TEXT,
    included_in_invoice BOOLEAN DEFAULT true  -- 거래처 계산서에 포함 여부
);

CREATE INDEX idx_site_expenses_daily_rate_log_id ON public.site_expenses(daily_rate_log_id);
```

### 1-I. `transactions` 테이블 수정 (기존 테이블에 컬럼 추가)

> ⚠️ **수정 포인트:** ERP_DESIGN에 명시되었으나 TECHNICAL에 누락된 항목.

```sql
-- 기존 transactions 테이블에 사업 프로젝트 연동 컬럼 추가
ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id);

CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON public.transactions(project_id);
```

---

## Step 2: RLS 정책 적용

> 부부 계정(2명)이 모든 비즈니스 데이터를 함께 조회/수정할 수 있도록 설정합니다.
> **가정:** Supabase Auth에서 부부 계정 2개가 이미 생성되어 있음.

```sql
-- 모든 비즈니스 테이블에 RLS 활성화
ALTER TABLE public.business_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_incomes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_rate_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_expenses       ENABLE ROW LEVEL SECURITY;

-- business_profiles: 인증된 사용자 전체 접근
CREATE POLICY "authenticated_full_access" ON public.business_profiles
    FOR ALL USING (auth.role() = 'authenticated');

-- clients: 인증된 사용자 전체 접근
CREATE POLICY "authenticated_full_access" ON public.clients
    FOR ALL USING (auth.role() = 'authenticated');

-- projects: 인증된 사용자 전체 접근
CREATE POLICY "authenticated_full_access" ON public.projects
    FOR ALL USING (auth.role() = 'authenticated');

-- project_incomes: 인증된 사용자 전체 접근
CREATE POLICY "authenticated_full_access" ON public.project_incomes
    FOR ALL USING (auth.role() = 'authenticated');

-- daily_rate_logs: 인증된 사용자 전체 접근
CREATE POLICY "authenticated_full_access" ON public.daily_rate_logs
    FOR ALL USING (auth.role() = 'authenticated');

-- crew_payments: 연결된 daily_rate_log 를 통한 접근 (인증된 사용자)
CREATE POLICY "authenticated_full_access" ON public.crew_payments
    FOR ALL USING (auth.role() = 'authenticated');

-- site_expenses: 인증된 사용자 전체 접근
CREATE POLICY "authenticated_full_access" ON public.site_expenses
    FOR ALL USING (auth.role() = 'authenticated');
```

---

## Step 3: 시드 데이터 삽입

### 3-A. 자사 프로필 초기 데이터

```sql
INSERT INTO public.business_profiles
    (owner_type, business_name, representative_name, is_default, include_portfolio)
VALUES
    ('kwangjun', '정광준', '정광준', true, true),
    ('euiyoung', '송의영', '송의영', true, false),
    ('joint',    '스튜디오 (미확정)', '정광준 · 송의영', true, true);
```

### 3-B. 기본 거래처 시드 데이터

```sql
INSERT INTO public.clients (name, contacts) VALUES
    ('스튜디오리프', '[]'),
    ('기브온',       '[]'),
    ('그립두드',     '[]'),
    ('한국 다이이치산쿄', '[]');
```

---

## Step 4: FSD 폴더 구조

아래 구조로 `src/` 디렉토리를 세팅합니다.

```
src/
├── app/
│   ├── providers/          # QueryClient, AuthProvider 등
│   └── router.tsx
│
├── pages/
│   ├── business/           # /business 라우트
│   │   ├── dashboard/      # ERP 메인 대시보드
│   │   ├── kanban/         # 파이프라인 칸반 보드
│   │   ├── daily-log/      # 퍼스트 일당 로그 뷰
│   │   ├── clients/        # 거래처 관리
│   │   └── settings/       # 자사 정보 설정
│   └── personal/           # 기존 가계부 페이지 (유지)
│
├── widgets/
│   ├── income-kanban/      # 칸반 보드 전체 위젯
│   ├── business-dashboard/ # ERP 대시보드 위젯
│   ├── client-list/        # 거래처 테이블 위젯
│   └── cashflow-calendar/  # 현금 흐름 캘린더 위젯
│
├── features/
│   ├── manage-business-profile/  # 자사 정보 수정 기능
│   ├── manage-pipeline/          # 칸반 드래그앤드롭 + 상태 변경
│   ├── log-daily-rate/           # 일당 빠른 입력 모달
│   ├── manage-crew/              # 크루원 인건비 관리
│   ├── manage-site-expenses/     # 진행비 관리
│   └── calculate-tax/            # 원천세/부가세 예상액 계산
│
├── entities/
│   ├── business/           # business_profiles 타입 + API
│   ├── client/             # clients 타입 + API
│   ├── project/            # projects + project_incomes 타입 + API
│   └── daily-rate/         # daily_rate_logs + crew_payments + site_expenses 타입 + API
│
└── shared/
    ├── ui/                 # 공통 컴포넌트 (Button, Modal, Badge 등)
    ├── lib/
    │   └── supabase.ts     # Supabase 클라이언트
    └── constants/
        └── business.ts     # owner_type, income_type, status 상수 정의
```

---

## Step 5: entities 레이어 타입 정의

### `shared/constants/business.ts`

```typescript
// 사업 주체
export const OWNER_TYPES = ['kwangjun', 'euiyoung', 'joint'] as const;
export type OwnerType = typeof OWNER_TYPES[number];

// 수입 유형
export const INCOME_TYPES = ['freelance', 'daily_rate', 'photo_project'] as const;
export type IncomeType = typeof INCOME_TYPES[number];

// 칸반 상태 (순서 중요 — 파이프라인 순서)
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

// 프로젝트 카테고리 태그
export const PROJECT_CATEGORIES = [
    '영상조명', '영상스케치', '사진조명',
    '조명_퍼스트', '조명_프리랜서',
    '그래픽디자인', '공간디자인', '모션그래픽',
    '사진촬영_공동', '중계',
] as const;

// 사업 주체별 색상 코딩
export const OWNER_COLORS: Record<OwnerType, string> = {
    kwangjun: '#3B82F6',   // 🟦 파란색
    euiyoung: '#22C55E',   // 🟩 초록색
    joint:    '#A855F7',   // 🟪 보라색
};

// 사업 주체 라벨
export const OWNER_LABELS: Record<OwnerType, string> = {
    kwangjun: '광준',
    euiyoung: '의영',
    joint:    '공동',
};

// 진행비 카테고리
export const EXPENSE_CATEGORIES = ['주차비', '주유비', '톨비', '식비', '기타'] as const;
```

### `entities/client/types.ts`

```typescript
export interface Contact {
    name:  string;
    role?:  string;
    dept?:  string;
    phone?: string;
    email?: string;
}

export interface Client {
    id:              string;
    name:            string;
    business_number?: string;
    files:           string[];   // URL 배열
    contacts:        Contact[];
    created_at:      string;
    // 집계 (뷰/조인으로 계산)
    total_revenue?:  number;
    project_count?:  number;
    last_project_at?: string;
}
```

### `entities/project/types.ts`

```typescript
import { OwnerType, IncomeType, PipelineStatus } from '@/shared/constants/business';

export interface Project {
    id:             string;
    name:           string;
    client_id?:     string;
    business_owner: OwnerType;
    income_type:    IncomeType;
    categories:     string[];
    status:         'active' | 'completed' | 'cancelled';
    duration_days?: number;
    start_date?:    string;
    end_date?:      string;
    created_at:     string;
    // 조인
    client?:        { id: string; name: string };
}

export interface ProjectIncome {
    id:                     string;
    project_id:             string;
    title:                  string;  // '선금', '잔금' 등
    amount:                 number;
    expected_date?:         string;
    status:                 PipelineStatus;
    matched_transaction_id?: string;
    created_at:             string;
    // 조인
    project?:               Project;
}
```

### `entities/daily-rate/types.ts`

```typescript
export interface DailyRateLog {
    id:                     string;
    user_id?:               string;
    client_id?:             string;
    work_date:              string;
    site_name:              string;
    amount_gross:           number;
    withholding_rate:       number;   // 광준 본인: 0
    amount_net:             number;   // DB GENERATED
    payment_status:         'pending' | 'paid';
    payment_date?:          string;
    matched_transaction_id?: string;
    created_at:             string;
    // 조인
    client?:                { id: string; name: string };
    crew_payments?:         CrewPayment[];
    site_expenses?:         SiteExpense[];
}

export interface CrewPayment {
    id:               string;
    daily_rate_log_id: string;
    crew_name:        string;
    role?:            string;   // '세컨', '서드', '막내', '기타'
    amount_gross:     number;
    withholding_rate: number;   // 3.3
    amount_net:       number;   // DB GENERATED
    account_info?:    string;
    paid:             boolean;
    paid_date?:       string;
}

export interface SiteExpense {
    id:                 string;
    daily_rate_log_id:  string;
    category:           string;
    amount:             number;
    memo?:              string;
    receipt_url?:       string;
    included_in_invoice: boolean;
}

// 정산 계산서 총액 계산 헬퍼 (프론트 로직)
export function calcInvoiceTotal(log: DailyRateLog): number {
    const crewTotal = (log.crew_payments ?? [])
        .reduce((sum, c) => sum + c.amount_gross, 0);
    const expenseTotal = (log.site_expenses ?? [])
        .filter(e => e.included_in_invoice)
        .reduce((sum, e) => sum + e.amount, 0);
    return log.amount_gross + crewTotal + expenseTotal;
}
```

---

## Step 6: features 레이어 구현 명세

### 6-A. `features/log-daily-rate` — 일당 빠른 입력 모달

**트리거:** 하단 FAB 버튼 또는 "+" 버튼 클릭
**UI:** 하단 Drawer (모바일 친화적) 또는 중앙 Modal
**3단계 입력:**

| 필드 | 타입 | 비고 |
|------|------|------|
| 날짜 (work_date) | Date picker | 기본값: 오늘 |
| 거래처 (client_id) | Combobox | clients 목록에서 선택 or 직접 입력 |
| 현장명 (site_name) | Text | 예: "현대차 CF" |
| 일당 금액 (amount_gross) | Number | 입력 즉시 실수령액 실시간 표시 (withholding_rate=0 이므로 동일) |

**선택 추가 섹션 (접이식):**
- 크루원 추가 (crew_payments): 이름, 역할, 금액 → 3.3% 실수령액 자동 계산
- 진행비 추가 (site_expenses): 카테고리 선택, 금액
- 정산 계산서 총액 실시간 표시

**저장 로직:**
1. `daily_rate_logs` INSERT
2. 크루원 있으면 `crew_payments` 일괄 INSERT
3. 진행비 있으면 `site_expenses` 일괄 INSERT
4. 위 3개를 하나의 트랜잭션으로 처리

---

### 6-B. `features/manage-pipeline` — 칸반 드래그앤드롭

**라이브러리:** `@dnd-kit/core` + `@dnd-kit/sortable` (권장) 또는 `framer-motion`

**구현 사항:**
- 컬럼: 8개 상태 (`PIPELINE_STATUSES` 순서 그대로)
- 보류취소 컬럼은 접이식 (기본 숨김, 토글로 펼치기)
- 카드 드롭 시 `project_incomes.status` PATCH 호출
- 상단 필터: OwnerType 버튼 3개 (광준/의영/공동/전체)
- 카드 헤더: 사업 주체 색상 줄 표시 (`OWNER_COLORS` 참조)

**칸반 카드 표시 정보:**
```
┌─────────────────────────────┐
│ 🟦 (주체 컬러 바)            │
│ 프로젝트명 (bold, large)     │
│ 거래처명                     │
│ 마감일: YYYY-MM-DD          │
│ 금액: ₩X,XXX,XXX            │
└─────────────────────────────┘
```

---

### 6-C. `features/calculate-tax` — 세금 계산 로직

```typescript
// 크루원 원천징수 계산 (3.3%)
export function calcWithholding(gross: number, rate = 3.3): number {
    return Math.floor(gross * (rate / 100));
}

// 월별 일당 수입 집계 (광준)
// daily_rate_logs에서 해당 월 데이터 필터 후 합산
export function sumMonthlyIncome(logs: DailyRateLog[]): {
    totalDays: number;
    totalGross: number;
    totalExpenses: number;   // included_in_invoice=true 항목 합산
    invoiceTotal: number;    // 거래처 청구 총액
} { /* ... */ }

// 종합소득세 예상 리저브 (단순 추산, 세율 3.3% 또는 실효세율 적용)
export function estimateTaxReserve(annualIncome: number): number {
    // 단순화: 연소득 × 추산 실효세율 (정확한 신고는 세무사 권장)
    const rate = annualIncome < 12_000_000 ? 0.06 :
                 annualIncome < 46_000_000 ? 0.15 : 0.24;
    return Math.floor(annualIncome * rate);
}
```

---

## Step 7: widgets 레이어 구현 명세

### 7-A. `widgets/income-kanban` — 파이프라인 칸반 보드

```
[Props]
- ownerFilter: OwnerType | 'all'  (부모에서 주입, 기본값 'all')

[내부 구성]
- KanbanBoard: 전체 레이아웃, 가로 스크롤
  └── KanbanColumn × 8 (상태별)
       └── KanbanCard × N (project_incomes)
            └── CardDetailModal (클릭 시 열림)

[데이터 페칭]
SELECT pi.*, p.name as project_name, p.business_owner, p.client_id,
       c.name as client_name
FROM project_incomes pi
JOIN projects p ON pi.project_id = p.id
LEFT JOIN clients c ON p.client_id = c.id
WHERE p.status = 'active'
  AND (owner_filter = 'all' OR p.business_owner = owner_filter)
ORDER BY pi.expected_date ASC NULLS LAST;
```

### 7-B. `widgets/cashflow-calendar` — 현금 흐름 캘린더

```
[데이터 소스 통합]
- project_incomes.expected_date  → 입금 예정 (+)
- daily_rate_logs.payment_date   → 일당 입금 예정 (+)
- transactions (type='expense', is_business=true) → 사업 고정비 (-)

[각 날짜 셀 표시]
- 입금 예정: 초록색 금액 (+₩XXX)
- 지출 예정: 빨간색 금액 (-₩XXX)
- 날짜 hover 시: 상세 목록 툴팁

[주/월 가용 현금 누적 표시]
오늘 기준 잔고 + 예상 입금 합계 - 예상 지출 합계 = 예상 런웨이
```

### 7-C. `widgets/client-list` — 거래처 관리 테이블

```
[테이블 컬럼]
- 업체명
- 사업자번호
- 담당자 수 (contacts.length)
- 누적 매출 (project_incomes 집계)
- 총 프로젝트 수
- 최근 거래일
- 액션 (편집 / 상세보기)

[상세 패널 (사이드 슬라이더)]
- 기본 정보 편집
- 담당자 목록 (추가/삭제/편집)
- 첨부 파일 (사업자등록증 등)
- 연결된 프로젝트 목록
```

---

## Step 8: 주요 Supabase 쿼리 모음

### 8-A. 칸반 보드 데이터 (집계 포함)

```sql
SELECT
    pi.id,
    pi.title,
    pi.amount,
    pi.expected_date,
    pi.status,
    p.id           AS project_id,
    p.name         AS project_name,
    p.business_owner,
    p.categories,
    c.name         AS client_name
FROM public.project_incomes pi
JOIN public.projects p ON pi.project_id = p.id
LEFT JOIN public.clients c ON p.client_id = c.id
WHERE p.status = 'active'
ORDER BY pi.expected_date ASC NULLS LAST;
```

### 8-B. 월별 일당 요약 (광준)

```sql
SELECT
    DATE_TRUNC('month', work_date) AS month,
    COUNT(*)                        AS total_days,
    SUM(amount_gross)               AS total_gross,
    -- 거래처 청구 총액 (일당 + 크루 + 진행비)
    SUM(amount_gross)
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
    ), 0)                           AS invoice_total
FROM public.daily_rate_logs drl
GROUP BY DATE_TRUNC('month', work_date)
ORDER BY month DESC;
```

### 8-C. 거래처별 LTV 집계

```sql
SELECT
    c.id,
    c.name,
    COUNT(DISTINCT p.id)            AS project_count,
    COALESCE(SUM(pi.amount), 0)     AS total_revenue,
    MAX(p.end_date)                 AS last_project_date
FROM public.clients c
LEFT JOIN public.projects p ON p.client_id = c.id
LEFT JOIN public.project_incomes pi
    ON pi.project_id = p.id
    AND pi.status = '입금완료'
GROUP BY c.id, c.name
ORDER BY total_revenue DESC;
```

### 8-D. 사업 주체별 수입 요약

```sql
SELECT
    p.business_owner,
    DATE_TRUNC('month', pi.expected_date) AS month,
    SUM(pi.amount)                         AS total_income,
    COUNT(*)                               AS income_count
FROM public.project_incomes pi
JOIN public.projects p ON pi.project_id = p.id
WHERE pi.status IN ('입금대기', '입금완료')
GROUP BY p.business_owner, DATE_TRUNC('month', pi.expected_date)
ORDER BY month DESC, total_income DESC;
```

---

## 세무 처리 참고 (Tax Notes)

| 항목 | 광준 | 의영 | 공동 사진사업 |
|------|------|------|------------|
| 본인 수취 원천징수 | **없음** (세금계산서 발행) | 3.3% 수취 가능 | 경우에 따라 |
| 크루 지급 시 원천징수 | **3.3%** 차감 후 지급 | — | — |
| `withholding_rate` (daily_rate_logs) | **0** | N/A | N/A |
| `withholding_rate` (crew_payments) | **3.3** | N/A | N/A |
| 종합소득세 | 5월 신고 | 5월 신고 | 5월 신고 |

---

## 📌 추가 구현 우선순위 (Phase 4 이후)

아래는 Phase 4 범위 밖이지만 ERP_DESIGN에서 언급된 사항입니다.

1. **견적서 PDF 자동 생성** — 사업 주체별 템플릿, `include_portfolio` 옵션 반영
2. **계좌 거래내역 매칭 UI** — `matched_transaction_id` 연동, 미매칭 건 알림
3. **공동 사진사업 예약 캘린더** — 촬영일 등록, 중복 방지
4. **포트폴리오 자동 연동** — 프로젝트 완료 시 포트폴리오 사이트 API 호출

---

*이 명세서의 SQL은 복사하여 Supabase SQL Editor에 바로 붙여넣기 가능합니다.*
*타입스크립트 코드는 복사하여 해당 경로에 파일 생성 후 사용하세요.*
