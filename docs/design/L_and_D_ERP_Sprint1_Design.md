# Sprint 1 디자인 및 아키텍처 문서 V2.0

> **업데이트:** 2026-03-11 (코드 리뷰 기반 수정)
> **변경 사항:** 폴더 경로 수정, DB 마이그레이션 보강, Safety Net 잔고 전략 변경, Bank Sync 매칭 기준 강화, `user_settings` 컬럼 확장
> **목표:** 재무 안전망(3개월 버퍼, 종소세 파우치)과 크루 페이 통장 대조기(Bank Sync Verifier) 구현을 위한 DB, API, UI 아키텍처를 확정합니다.

---

## 📋 Sprint 1 구현 범위

| # | 기능 | 등급 | 예상 시간 |
|---|------|------|----------|
| 1 | 3개월 버퍼 Safety Net 게이지 | 🔴 MUST | 0.5일 |
| 2 | 종소세 (15~20%) 예비비 박스 | 🔴 MUST | 0.5일 |
| 3 | 크루 페이 Bank Sync Verifier | 🔴 MUST | 1일 |
| 4 | 가상 월급 이체 로직 | 🔴 MUST | 0.5일 |

---

## 🗄️ 0. DB 마이그레이션 (선행 필수)

> ⚠️ **Database-First 원칙:** UI 코드 작성 전 반드시 마이그레이션 실행 후 `npx supabase gen types` 실행.

### 파일명: `20260311_sprint1_safety_net_and_bank_sync.sql`

```sql
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
```

---

## 1. 3개월 버퍼 Safety Net 게이지

### A. 데이터 전략 (V1 설계 변경)

> **변경 이유:** "수동 잔고 입력" 방식은 금방 stale해짐.
> 대신 기존 `assets` 테이블에서 `is_safety_net = true`로 지정된 계좌들의 `current_balance` 합산으로 자동 계산.

**흐름:**
1. 사용자가 `/settings/assets`에서 특정 계좌에 "안전망 계좌" 토글 체크
2. 잔고를 업데이트할 때 해당 계좌의 `current_balance` 수정
3. `SafetyNetCard`가 `is_safety_net = true`인 계좌들의 `current_balance` 합계 조회
4. `user_settings.monthly_living_expense × 3` 대비 % 계산 → 게이지 표시

**게이지 계산:**
```ts
const target = monthly_living_expense * 3
const current = sum(assets.filter(a => a.is_safety_net).current_balance)
const percentage = Math.min((current / target) * 100, 100)
```

**컬러 로직:**
- `< 50%` → 🔴 빨강 (위험, 지출 경고 활성화)
- `50~79%` → 🟡 노랑 (주의)
- `>= 80%` → 🟢 초록 (안전)

### B. API (`src/entities/user-settings/api/`)

```
get-user-settings.ts       → user_settings 조회 (없으면 기본값 생성)
update-user-settings.ts    → monthly_living_expense, income_tax_rate 등 업데이트
get-safety-net-balance.ts  → is_safety_net=true 계좌들의 current_balance 합계 조회
```

### C. UI 컴포넌트

**위치:** `src/widgets/safety-net-card/ui/SafetyNetCard.tsx` ← 독립 위젯 폴더

```
widgets/
├── vat-reserve-card/         (기존)
├── income-tax-reserve-card/  (신규 - 기능 2)
└── safety-net-card/          (신규 - 기능 1)  ← 여기
    └── ui/
        └── SafetyNetCard.tsx
```

**컴포넌트 구조:**
```tsx
<SafetyNetCard>
  <헤더> 안전망 (3개월 생활비 버퍼) </헤더>
  <게이지 바>
    현재: {current.toLocaleString()}원 / 목표: {target.toLocaleString()}원
    <Progress value={percentage} className={colorClass} />
  </게이지 바>
  <하단 안내>
    {percentage < 50 && "⚠️ 안전망이 부족합니다. 추가 지출을 자제하세요."}
    {percentage >= 80 && "✅ 안전망이 충분합니다."}
  </하단 안내>
  <설정 링크> 월 생활비 설정 → /settings/user </설정 링크>
</SafetyNetCard>
```

**BusinessDashboard.tsx 배치:**
```tsx
// VatReserveCard, IncomeTaxReserveCard 아래 또는 나란히 배치
<div className="grid gap-4 lg:grid-cols-3">
  <VatReserveCard />
  <IncomeTaxReserveCard />   {/* 기능 2 */}
  <SafetyNetCard />          {/* 기능 1 */}
</div>
```

---

## 2. 종소세 (15~20%) 예비비 박스

### A. 데이터 전략

별도 테이블 없이 `VatReserve` 패턴 그대로 재사용.
- 기존 `vat_reserves` 테이블의 `total_income` 값을 참조
- `user_settings.income_tax_rate` (기본 0.15) 곱해서 실시간 계산
- 별도 DB 저장 없음 → 계산 전용 (View 또는 프론트 계산)

**계산식:**
```ts
const incomeTaxReserve = totalIncome * income_tax_rate
// 예: 매출 5,000,000 × 0.15 = 750,000원 적립 필요
```

### B. 엔티티 & API

> ⚠️ **주의:** 별도 entity 폴더 생성 불필요. `vat` entity의 API를 확장하거나 `user-settings` entity에 포함.

```
get-income-tax-reserve.ts
→ getCurrentMonthVat()로 total_income 조회
→ getUserSettings()로 income_tax_rate 조회
→ { total_income, income_tax_amount, rate } 반환
```

### C. UI 컴포넌트

**위치:** `src/widgets/income-tax-reserve-card/ui/IncomeTaxReserveCard.tsx`
← ⚠️ **V1 설계 오류 수정: `vat-reserve-card` 폴더 안에 넣지 말 것**

`VatReserveCard.tsx`와 동일한 구조, 색상만 변경:
- VAT 카드: 앰버(amber) 계열
- 종소세 카드: 퍼플(violet) 계열 → 시각적 구분 명확화

```tsx
// VatReserveCard의 색상 토큰만 violet으로 변경한 사실상 동일 컴포넌트
// 차이점:
// - 제목: "세금 보유금 (종소세 15%)"
// - 금액: total_income × income_tax_rate
// - 색상: amber → violet
// - 설정: income_tax_rate 조정 링크 포함
```

**설정 UX:**
```
[ℹ️ 세율 안내]
예상 연 소득 구간별 세율:
  ~1,200만원: 6%
  ~4,600만원: 15%  ← 기본값
  ~8,800만원: 24%
[설정에서 변경 →]
```

---

## 3. 크루 페이 Bank Sync Verifier

### A. 데이터 흐름

```
[사용자] 기업은행 엑셀 업로드
    ↓
[파서] 날짜, 금액, 이체 메모 추출
    ↓
[매칭 엔진] crew_payments(paid=true) vs 엑셀 출금 내역 대조
    ↓
[결과] ✅ 매칭됨 / ❓ 앱엔 있는데 통장엔 없음 / ⚠️ 통장엔 있는데 앱에 없음
    ↓
[확정] bank_verified = true, verified_at = now() 업데이트
```

### B. 매칭 알고리즘 (V1 설계 보강)

> ⚠️ **V1 설계 허점 수정:** 금액만으로 매칭 시 같은 날 동일 금액 크루 2명이면 중복 매칭 오류 발생.
> → 아래 3개 조건 AND 매칭으로 강화.

```ts
interface BankRecord {
  date: string        // 출금 날짜
  amount: number      // 출금 금액
  memo: string        // 이체 메모 (수취인 이름 포함)
}

function matchCrewPayment(payment: CrewPayment, bankRecord: BankRecord): MatchResult {
  const dateMatch = Math.abs(dayDiff(payment.paid_date, bankRecord.date)) <= 1  // 날짜 ±1일
  const amountMatch = payment.amount_net === bankRecord.amount                  // 금액 정확 일치
  const nameMatch = bankRecord.memo.includes(payment.crew_name)                 // 이름 포함

  if (dateMatch && amountMatch && nameMatch) return 'matched'
  if (dateMatch && amountMatch && !nameMatch) return 'candidate'  // 후보 (이름 미확인)
  return 'unmatched'
}
```

**매칭 상태 4가지:**
| 상태 | 조건 | 표시 |
|------|------|------|
| `matched` | 3조건 모두 일치 | ✅ 초록 |
| `candidate` | 날짜+금액 일치, 이름 미확인 | 🟡 노랑 (수동 확인 요청) |
| `app_only` | 앱엔 있는데 통장엔 없음 | ❌ 빨강 (미송금 의심) |
| `bank_only` | 통장엔 있는데 앱에 기록 없음 | ⚠️ 회색 (앱 기록 누락) |

### C. API (`src/features/verify-crew-payment/api/`)

```
parse-bank-export.ts
→ 기업은행/카카오뱅크 엑셀 파싱
→ { date, amount, memo }[] 반환

match-crew-payments.ts
→ 파싱된 bank records vs crew_payments(paid=true) 대조
→ MatchResult[] 반환

confirm-bank-verification.ts
→ matched 항목들에 bank_verified=true, verified_at=now() 업데이트
→ { success, updated_count } 반환
```

### D. UI 컴포넌트 (`src/features/verify-crew-payment/ui/`)

> ⚠️ **V1 설계 위치 수정:** `manage-daily-rate` 폴더가 아닌 독립 feature 폴더로 분리.
> `manage-daily-rate`는 조회/입력 담당, `verify-crew-payment`는 검증 담당.

**BankSyncVerifyModal.tsx:**
```
[파일 업로드 드롭존]
  → CSV/XLSX 드래그앤드롭 or 클릭

[매칭 결과 테이블]
  크루명 | 지급일 | 금액 | 앱 상태 | 통장 상태 | 매칭 결과
  홍길동 | 3/10  | 200,000 | ✓지급완료 | ✓출금확인 | ✅ 매칭됨
  김철수 | 3/10  | 150,000 | ✓지급완료 | ❌없음     | ❌ 미송금 의심
  이영희 | 3/11  | 200,000 | ✓지급완료 | 🟡후보     | 🟡 이름 확인 필요

[요약]
  총 대상: N건 | 매칭: N건 | 미확인: N건 | 문제: N건

[버튼]
  [매칭 항목 일괄 확정]  [닫기]
```

**DailyRateTable.tsx 변경 (기존 파일 수정):**
```tsx
// 기존 'paid' 뱃지에 verified 상태 추가
{payment.bank_verified
  ? <Badge variant="success">✓ 송금확인</Badge>   // 초록
  : payment.paid
  ? <Badge variant="secondary">지급완료</Badge>    // 회색
  : <Badge variant="outline">미지급</Badge>}       // 기존

// DailyRateTable 우상단에 버튼 추가
<Button onClick={() => setVerifyModalOpen(true)}>
  🏦 통장 대조
</Button>
```

---

## 4. 가상 월급 이체 로직

### A. 데이터 전략

새 테이블 불필요. 기존 `transactions` 테이블에 특수 타입으로 기록.

```ts
// 가상 월급 이체 = 내부 이체(transfer) 타입
{
  type: 'transfer',
  category: '🔄 이체 > 가상월급',  // MDT_CATALOG 이체 카테고리 활용
  amount: virtual_salary_amount,
  memo: `${year}년 ${month}월 가상 월급`,
  from_asset_id: 사업자계좌_id,
  to_asset_id: 생활비계좌_id,
  is_virtual_salary: true          // 필터링용 플래그
}
```

> `transactions` 테이블에 `is_virtual_salary boolean DEFAULT false` 컬럼 추가 필요.
> → 위 마이그레이션 파일에 포함.

### B. UI (`src/features/manage-virtual-salary/ui/`)

**VirtualSalarySettingsCard.tsx** (`/settings/user` 페이지에 배치):
```
[가상 월급 설정]
월 지급액: [____3,000,000____] 원
지급일:   [매월 __25__ 일]

[저장]

[이번 달 가상 월급 지금 기록하기] ← 수동 트리거 버튼
```

**대시보드 표시:**
- `BusinessDashboard`의 요약 카드 중 하나에 "이번 달 가상 월급: ✅ 기록됨 / ⏳ 미기록" 상태 추가

---

## 🗂️ 최종 파일 구조 요약

```
src/
├── entities/
│   └── user-settings/              ← 신규
│       ├── model/types.ts
│       └── api/
│           ├── get-user-settings.ts
│           ├── update-user-settings.ts
│           └── get-safety-net-balance.ts
│
├── features/
│   ├── verify-crew-payment/        ← 신규 (Bank Sync)
│   │   ├── api/
│   │   │   ├── parse-bank-export.ts
│   │   │   ├── match-crew-payments.ts
│   │   │   └── confirm-bank-verification.ts
│   │   └── ui/
│   │       └── BankSyncVerifyModal.tsx
│   │
│   └── manage-virtual-salary/      ← 신규
│       └── ui/
│           └── VirtualSalarySettingsCard.tsx
│
└── widgets/
    ├── safety-net-card/            ← 신규 (독립 폴더)
    │   └── ui/SafetyNetCard.tsx
    │
    └── income-tax-reserve-card/    ← 신규 (독립 폴더)
        └── ui/IncomeTaxReserveCard.tsx
```

**수정되는 기존 파일:**
```
supabase/migrations/20260311_sprint1_safety_net_and_bank_sync.sql  ← 신규
src/widgets/business-dashboard/ui/BusinessDashboard.tsx            ← SafetyNetCard, IncomeTaxReserveCard 추가
src/features/manage-daily-rate/ui/DailyRateTable.tsx               ← bank_verified 뱃지, 통장대조 버튼 추가
src/app/(dashboard)/settings/user/page.tsx                         ← 가상월급 설정 카드 추가 (또는 신규)
```

---

## ✅ 구현 체크리스트 (Antigravity용)

### Phase 1: DB 마이그레이션
- [ ] `20260311_sprint1_safety_net_and_bank_sync.sql` 실행
- [ ] `npx supabase gen types > src/shared/types/database.types.ts`

### Phase 2: Entities & API
- [ ] `user-settings` entity 생성 (types, get, update)
- [ ] `get-safety-net-balance.ts` 구현
- [ ] `get-income-tax-reserve.ts` 구현 (vat entity 확장)
- [ ] `verify-crew-payment` feature API 3개 구현

### Phase 3: UI 컴포넌트
- [ ] `SafetyNetCard.tsx` 신규 위젯
- [ ] `IncomeTaxReserveCard.tsx` 신규 위젯
- [ ] `BankSyncVerifyModal.tsx` 신규 feature UI
- [ ] `VirtualSalarySettingsCard.tsx` 신규 feature UI

### Phase 4: 기존 파일 수정
- [ ] `BusinessDashboard.tsx` — 3카드 그리드 레이아웃 적용
- [ ] `DailyRateTable.tsx` — `bank_verified` 뱃지 + 통장대조 버튼
- [ ] `/settings/user/page.tsx` — 가상월급 설정 섹션 추가

### Phase 5: 검증
- [ ] Safety Net 게이지 %가 계좌 잔고 변경에 반응하는지 확인
- [ ] 종소세 카드 세율 설정 변경 시 금액 즉시 반영 확인
- [ ] Bank Sync: 동일 금액 크루 2명일 때 중복 매칭 없는지 확인
- [ ] Bank Sync: `app_only` 상태 케이스 정상 감지 확인
- [ ] 가상 월급 기록 시 가계부/사업부 양쪽 합산에서 제외(이중 계산 방지) 확인
