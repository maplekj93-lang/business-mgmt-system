# 🛠 Business ERP Technical Specification (Phase 4)

이 문서는 `ERP_DESIGN.md` 요구사항을 바탕으로 한 구체적인 기술 설계서입니다. 구현 시 이 명세를 기준으로 DB 마이그레이션 및 컴포넌트 개발을 진행합니다.

---

## 1. Database Schema Design (Supabase / PostgreSQL)

모든 테이블은 `public` 스키마에 위치하며, FSD의 `entities` 레이어와 매핑됩니다.

### 1.1. `business_profiles` (자사 정보)
*사업 주체별 프로필 (광준, 의영, 공동 사진사업)*
```sql
CREATE TABLE public.business_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_type TEXT NOT NULL, -- 'kwangjun', 'euiyoung', 'joint'
    business_name TEXT NOT NULL, -- 상호명
    representative_name TEXT NOT NULL, -- 대표자명
    business_number TEXT, -- 사업자번호
    address TEXT,
    bank_name TEXT,
    account_number TEXT,
    portfolio_url TEXT,
    intro_document_url TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.2. `clients` (거래처)
```sql
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    business_number TEXT,
    files JSONB DEFAULT '[]', -- 사업자등록증 등 파일 URL 리스트
    contacts JSONB DEFAULT '[]', -- [{name, role, phone, email, dept}, ...]
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.3. `projects` (프로젝트 핵심)
```sql
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    client_id UUID REFERENCES public.clients(id),
    business_owner TEXT NOT NULL, -- 'kwangjun', 'euiyoung', 'joint'
    income_type TEXT NOT NULL, -- 'freelance', 'daily_rate', 'photo_project'
    categories TEXT[] DEFAULT '{}', -- ['영상조명', '그래픽디자인', ...]
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    duration_days NUMERIC, -- 소요 일수
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.4. `project_incomes` (수입 파이프라인/칸반 카드)
```sql
CREATE TABLE public.project_incomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL, -- '선금', '잔금' 등
    amount NUMERIC NOT NULL DEFAULT 0,
    expected_date DATE, -- 입금 예정일/마감일
    status TEXT NOT NULL DEFAULT '의뢰중', -- 칸반 상태
    matched_transaction_id UUID, -- 실제 입금 내역 연동 (transactions 테이블)
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.5. `daily_rate_logs` (광준 전용 일당 로그)
```sql
CREATE TABLE public.daily_rate_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id),
    work_date DATE NOT NULL,
    site_name TEXT NOT NULL,
    amount_gross NUMERIC NOT NULL, -- 세전
    withholding_rate NUMERIC DEFAULT 3.3,
    amount_net NUMERIC GENERATED ALWAYS AS (amount_gross * (1 - withholding_rate / 100)) STORED,
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid'
    payment_date DATE,
    matched_transaction_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.6. `crew_payments` & `site_expenses` (현장 정산 관련)
```sql
-- 크루 인건비
CREATE TABLE public.crew_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_rate_log_id UUID REFERENCES public.daily_rate_logs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT, -- '세컨', '서드' 등
    amount_gross NUMERIC NOT NULL,
    withholding_rate NUMERIC DEFAULT 3.3,
    amount_net NUMERIC,
    account_info TEXT,
    is_paid BOOLEAN DEFAULT false,
    paid_date DATE
);

-- 진행비 (현장 지출)
CREATE TABLE public.site_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_rate_log_id UUID REFERENCES public.daily_rate_logs(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- '주차비', '주유비' 등
    amount NUMERIC NOT NULL,
    memo TEXT,
    receipt_url TEXT,
    included_in_invoice BOOLEAN DEFAULT true
);
```

---

## 2. FSD Folder Structure Mapping

애플리케이션 내의 위치를 지정합니다.

- **`src/entities/`**
    - `business/`: 프로필 모델 및 API
    - `client/`: 거래처 모델 및 API
    - `project/`: 프로젝트, 수입 파이프라인, 일당 로그 스키마 및 API
- **`src/features/`**
    - `manage-business-profile/`: 자사 정보 수정 기능
    - `manage-pipeline/`: 칸반 보드 드래그 앤 드롭, 상태 변경
    - `log-daily-rate/`: 일당 빠른 입력 모달 및 로직
    - `calculate-tax/`: 원천세/부가세 예상 내역 산출 로직
- **`src/widgets/`**
    - `income-kanban/`: 파이프라인 칸반 보드 위젯
    - `business-dashboard/`: 사업 통합 지표 차트 및 현금 흐름 캘린더
    - `client-list/`: 거래처 관리 테이블 및 상세 패널

---

## 3. UI/UX 구현 명세

### 3.1. 칸반 보드 (Trello Style)
- **UI:** `framer-motion` 또는 `dnd-kit`을 사용한 매끄러운 드래그앤드롭.
- **필터:** 사업 주체(광준/의영/공동)별 필터링 기능 상단 배치.
- **카드 스타일:** 주체별 색상 코딩 (광준 🟦, 의영 🟩, 공동 🟪).

### 3.2. 일당 로그 (Daily Log)
- **빠른 입력:** 모바일에서도 편하게 입력 가능한 하단 시트(Drawer) 또는 중앙 모달.
- **자동 계산:** 일당 입력 시 3.3% 제외 실수령액 실시간 표시.

### 3.3. 현금 흐름 캘린더
- **데이터 소스:** `project_incomes.expected_date` + `daily_rate_logs.payment_date` + 고정비용(지출 카테고리).
- **시각화:** 캘린더 날짜별로 입금(+), 출금(-) 금액 및 합산 가용 현금 표시.

---

## 4. 보안 및 권한 (RLS)
- 모든 테이블은 인증된 사용자(`auth.uid()`)만 접근 가능하도록 설정.
- 사업 주체와 관계없이 현재 로그인한 부부 계정은 모든 비즈니스 데이터를 조회/수정할 수 있도록 정책 수립.
