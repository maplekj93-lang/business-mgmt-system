# Sprint 2 디자인 및 아키텍처 문서 V1.0

> **작성일:** 2026-03-11
> **전제:** Sprint 1 (Safety Net, 종소세 박스, Bank Sync Verifier, 가상 월급) 구현 완료 기준
> **목표:** 운영 효율화 — 이중 지출 차단, 구독 사업비 분리, 스마트 태깅 Lite, 입금 지연 추적

---

## 📋 Sprint 2 구현 범위

| # | 기능 | 등급 | 예상 시간 | 근거 |
|---|------|------|----------|------|
| 1 | **이중 지출 차단** (M-3) | 🔴 MUST | 1일 | 현재 순자산 통계 부정확 |
| 2 | **구독 사업비 강제 분리** (S-7) | 🟡 SHOULD | 0.5일 | `is_business` 컬럼 이미 존재 |
| 3 | **스마트 태깅 Lite** (S-1) | 🟡 SHOULD | 2일 | `mdt_allocation_rules` 인프라 존재 |
| 4 | **클라이언트 입금 지연 추적** (S-2) | 🟡 SHOULD | 1일 | `projects` + `project_incomes` 연계 |

---

## 🗄️ 0. DB 마이그레이션 (선행 필수)

### 파일명: `20260311_sprint2_tagging_and_tracking.sql`

```sql
-- ================================================================
-- Sprint 2 Migration: Double-Count Prevention, Smart Tagging, Lead-Time
-- ================================================================

-- 1. mdt_allocation_rules 테이블 확장
--    (현재: keyword, category_id만 있음 → business 태깅 지원 추가)
ALTER TABLE public.mdt_allocation_rules
    ADD COLUMN IF NOT EXISTS is_business        BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS business_tag       TEXT,       -- '현장식대', '유류비', '소모품' 등
    ADD COLUMN IF NOT EXISTS match_type         TEXT DEFAULT 'contains',
    -- 'exact' | 'contains' | 'starts_with'
    ADD COLUMN IF NOT EXISTS priority           INTEGER DEFAULT 10;
    -- 숫자 낮을수록 먼저 적용 (exact > contains)

-- 2. transactions 테이블 — 이중 차단 관련 컬럼
--    (이미 allocation_status가 있으나 personal_excluded 플래그 추가)
ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS excluded_from_personal BOOLEAN DEFAULT false;
    -- 사업비로 태깅된 순간 가계부 집계에서 제외

-- 3. projects 테이블 — 입금 지연 추적용 컬럼
ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS invoice_sent_date  DATE,       -- 세금계산서 발행일
    ADD COLUMN IF NOT EXISTS expected_payment_date DATE,    -- 예상 입금일
    ADD COLUMN IF NOT EXISTS actual_payment_date   DATE;    -- 실제 입금 확인일
    -- lead_time = actual_payment_date - invoice_sent_date (계산 컬럼 불필요, 프론트 계산)

-- 4. clients 테이블 — 클라이언트별 평균 리드타임 캐시
ALTER TABLE public.clients
    ADD COLUMN IF NOT EXISTS avg_payment_lead_days  INTEGER,  -- 평균 입금 소요일 (자동 계산)
    ADD COLUMN IF NOT EXISTS total_projects_count   INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_revenue          NUMERIC DEFAULT 0;
```

---

## 1. 이중 지출 차단 (Double-Count Prevention)

### 배경

현재 가계부 개인 지출과 사업비 지출이 양쪽에 모두 합산됨.
예: 현장 식대 30,000원 → 가계부 식비 합계 + 사업 지출 합계 둘 다 포함 → 순자산 이중 차감.

### A. 로직 설계

```
[사용자가 거래를 사업비로 태깅]
    ↓
allocation_status = 'business_allocated'
excluded_from_personal = true           ← NEW
    ↓
[가계부 집계 쿼리]
WHERE excluded_from_personal = false    ← 자동 제외
    ↓
[사업비 집계 쿼리]
WHERE allocation_status LIKE 'business%'
```

**핵심 규칙:**
- `excluded_from_personal = true` 설정 시 → 가계부 지출 합계에서 자동 제거
- 반대로 사업비 태깅 해제 시 → `excluded_from_personal = false` 복원
- 이체(transfer) 타입은 이미 양쪽 합산에서 제외 → 해당 없음

### B. 영향 받는 기존 API 수정

```
src/entities/transaction/api/get-monthly-stats.ts
→ personal 모드 집계 쿼리에 .eq('excluded_from_personal', false) 추가

src/entities/analytics/api/get-analytics.ts (존재 시)
→ 동일하게 personal 트랙 필터 추가
```

> ⚠️ **주의:** 기존 stats RPC 함수(`get_filtered_transactions`, `get_dashboard_stats` 등)가
> Supabase DB 레벨에 정의되어 있다면 해당 함수도 수정 필요.
> `20260205_create_filtered_transactions_rpc.sql` 참고.

### C. UI 변경 — 태깅 시 피드백 추가

**`src/features/allocate-transaction/ui/allocation-dialog.tsx` 수정:**

```tsx
// 사업비로 변경 시 확인 토스트
if (newStatus === 'business_allocated') {
  toast.info('이 지출이 가계부에서 제외되고 사업비로 이동됩니다.')
}
// 사업비에서 개인으로 변경 시
if (prevStatus === 'business_allocated' && newStatus === 'personal') {
  toast.info('이 지출이 다시 가계부 집계에 포함됩니다.')
}
```

**`src/widgets/transaction-history/` 수정:**
- `excluded_from_personal = true` 항목 → 가계부 뷰에서 취소선 + 회색 표시 (삭제 아님, 시각적 구분)
- 사업비 뷰에서는 정상 표시

---

## 2. 구독 서비스 사업비 강제 분리 (Subscription Business Tag)

### 배경

`recurring_expenses` 테이블에 `is_business` 컬럼이 이미 있으나,
현재 UI에서 시각적 구분이 없고 매입세액 공제 대상 집계도 없음.

### A. 로직 설계

```
is_business = true  →  사업 지출 레이어 (VAT 매입 공제 대상)
is_business = false →  개인 지출 레이어
```

**매입세액 공제 합계 계산:**
```ts
const vatDeductible = recurringExpenses
  .filter(e => e.is_business && e.status === 'active')
  .reduce((sum, e) => sum + (e.amount / 11), 0)
  // 공급가 = 금액 / 1.1, 공급가의 10% = 금액 / 11
```

### B. UI 수정 — `/settings/recurring-expenses/page.tsx`

**현재:** is_business 토글 존재하나 색상 구분 없음

**변경:**
1. **색상 레이어 강제 분리:**
   - `is_business = true` → 카드/행에 파란(blue) 좌측 보더 + "사업비" 배지
   - `is_business = false` → 초록(green) 좌측 보더 + "개인" 배지

2. **사업비 구독 합계 카드 추가** (페이지 상단):
```tsx
<div className="grid grid-cols-2 gap-4 mb-6">
  <Card>
    <p>사업용 구독 월 합계</p>
    <p className="text-2xl font-bold text-blue-700">
      {businessTotal.toLocaleString()}원/월
    </p>
    <p className="text-xs text-slate-500">
      매입세액 공제 가능: 약 {vatDeductible.toLocaleString()}원
    </p>
  </Card>
  <Card>
    <p>개인용 구독 월 합계</p>
    <p className="text-2xl font-bold text-green-700">
      {personalTotal.toLocaleString()}원/월
    </p>
  </Card>
</div>
```

3. **자동 사업비 추천:** 구독 등록 시 이름에 'Adobe', 'Apple', 'Google', 'Gemini', 'Microsoft', 'AWS', 'Vercel' 포함 → `is_business = true` 자동 체크 + 안내 토스트

```ts
// 사업비 자동 추천 키워드 (대소문자 무관)
const BUSINESS_SUBSCRIPTION_KEYWORDS = [
  'adobe', 'apple', 'google', 'gemini', 'microsoft',
  'aws', 'vercel', 'github', 'figma', 'notion', 'slack',
  'dropbox', 'zoom', 'envato'
]
```

---

## 3. 스마트 태깅 Lite (Smart Tagging Lite)

### 전략: ML 없이 3단계 규칙 엔진으로 70~80% 자동분류

```
[1단계] Exact Match   — 가맹점명 완전 일치 → 즉시 분류 (우선순위 1)
[2단계] Contains Rule — 키워드 포함 여부  → 분류 추천 (우선순위 10)
[3단계] History Match — 과거 동일 가맹점 분류 패턴 → 분류 추천 (우선순위 20)
```

### A. 기존 인프라 확인

- `mdt_allocation_rules` 테이블: 이미 존재, 키워드 + category_id 매핑
- `20260305_apply_keyword_rules_and_classify.sql`: 기존 룰 50개+ 이미 등록
- **이미 있는 것 활용, 새로 만들지 않음**

### B. 신규 API — `src/features/refine-ledger/api/`

**`suggest-category.ts` (신규):**
```ts
// 미분류 거래 1건의 description으로 카테고리 추천
export async function suggestCategory(
  description: string
): Promise<{ category_id: number; category_name: string; confidence: 'high' | 'medium' | 'low'; rule_type: 'exact' | 'keyword' | 'history' } | null>
```

**`apply-tagging-rules.ts` (신규):**
```ts
// 미분류 거래 N건에 룰 일괄 적용
// confidence='high'(exact match)만 자동 적용, 나머지는 추천으로 표시
export async function applyTaggingRules(
  transactionIds: string[]
): Promise<{ auto_applied: number; suggested: number; unmatched: number }>
```

**`register-tagging-rule.ts` (신규):**
```ts
// 사용자가 분류 확정 시 → 새 룰로 등록 제안
// "스타벅스를 ☕커피로 15번 분류 → 룰 등록하시겠어요?"
export async function registerTaggingRule(
  keyword: string,
  category_id: number,
  is_business: boolean,
  match_type: 'exact' | 'contains'
): Promise<void>
```

### C. UI 수정 — `/transactions/unclassified` 페이지

**현재:** 미분류 목록 + 수동 카테고리 선택만 존재

**변경 1 — 상단 액션 바 추가:**
```tsx
<div className="flex gap-2 mb-4">
  <Button onClick={handleAutoApply} variant="default">
    ⚡ 룰 자동 적용  {/* confidence=high 항목만 즉시 분류 */}
  </Button>
  <Badge variant="outline">
    자동 적용 가능: {autoApplicableCount}건
  </Badge>
</div>
```

**변경 2 — 각 미분류 항목에 추천 배지:**
```tsx
{suggestion && (
  <div className="flex items-center gap-2 text-xs">
    <Badge variant="suggestion" className="bg-blue-100 text-blue-700">
      추천: {suggestion.category_name}
    </Badge>
    <span className="text-slate-400">
      {suggestion.rule_type === 'history' ? '과거 패턴' : '키워드 룰'}
    </span>
    <Button size="xs" onClick={() => applyAndRegister(suggestion)}>
      적용
    </Button>
  </div>
)}
```

**변경 3 — 룰 등록 제안 토스트:**
```
분류 완료 후, 동일 가맹점이 5건 이상이면:
"'스타벅스'를 ☕커피로 12번 분류했습니다. 자동 룰로 등록할까요?"
[등록] [나중에]
```

### D. 룰 관리 UI — `/settings/tagging-rules` (신규 페이지)

```
[키워드 룰 목록]
키워드         | 카테고리          | 사업비 | 적용 횟수 | 액션
스타벅스       | ☕ 커피           |   -   |    23회   | [삭제]
ADOBE          | 구독/사업비       |   ✓   |     8회   | [삭제]
GS칼텍스       | ⛽ 유류비/사업비  |   ✓   |    15회   | [삭제]

[+ 새 룰 추가]
키워드: [________]  카테고리: [선택▼]  사업비: [□]  [저장]
```

---

## 4. 클라이언트 입금 지연 추적 (Payment Lead-Time Tracker)

### 배경

"A 업체는 세금계산서 발행 후 평균 50일 걸린다" 데이터 →
새 프로젝트 수주 시 필요 버퍼 자금을 미리 계산 가능.

### A. 데이터 흐름

```
프로젝트 생성
    → invoice_sent_date 입력 (세금계산서 발행일)
    → expected_payment_date 자동 계산 (클라이언트 avg_lead + invoice_sent_date)
    → actual_payment_date 입력 (입금 match-income 시 자동 기록)
    → lead_time = actual - invoice_sent (사후 계산)
    → clients.avg_payment_lead_days 업데이트 (롤링 평균)
```

### B. 기존 파일 수정

**`src/entities/project/model/types.ts` 확장:**
```ts
export interface Project {
  // 기존 필드들...
  invoice_sent_date?: string | null       // NEW
  expected_payment_date?: string | null   // NEW
  actual_payment_date?: string | null     // NEW
  // 계산 필드 (프론트)
  payment_lead_days?: number              // actual - invoice_sent (일수)
}
```

**`src/features/match-income/` 수정:**
- 입금 매칭 완료 시 → `projects.actual_payment_date = today` 자동 업데이트
- `clients.avg_payment_lead_days` 롤링 평균 업데이트

### C. 신규 API — `src/entities/client/api/`

**`get-client-lead-time.ts` (신규):**
```ts
// 특정 클라이언트의 최근 N개 프로젝트 리드타임 통계
export async function getClientLeadTime(clientId: string): Promise<{
  client_name: string
  avg_lead_days: number
  min_lead_days: number
  max_lead_days: number
  recent_projects: { name: string; lead_days: number; date: string }[]
}>
```

### D. UI — 2곳에 표시

**① 프로젝트 상세 모달 (`KanbanCard` 또는 상세 페이지) 수정:**
```tsx
{/* 입금 일정 섹션 */}
<div className="space-y-2 text-sm">
  <div className="flex justify-between">
    <span className="text-slate-500">세금계산서 발행</span>
    <DatePicker value={invoice_sent_date} onChange={...} />
  </div>
  <div className="flex justify-between">
    <span className="text-slate-500">예상 입금일</span>
    <span className="text-slate-700">
      {expected_payment_date ?? `발행일 + ${client?.avg_lead_days ?? '?'}일`}
    </span>
  </div>
  <div className="flex justify-between">
    <span className="text-slate-500">실제 입금일</span>
    <span className={actual_payment_date ? 'text-green-600' : 'text-amber-500'}>
      {actual_payment_date ?? '대기 중'}
    </span>
  </div>
  {actual_payment_date && invoice_sent_date && (
    <div className="text-xs text-slate-400 text-right">
      리드타임: {leadDays}일 (이 클라이언트 평균 {avgLeadDays}일)
    </div>
  )}
</div>
```

**② 비즈니스 대시보드 — 미수금 경보 위젯 신규 추가:**

`src/widgets/receivables-alert/ui/ReceivablesAlertCard.tsx` (신규)

```tsx
// 세금계산서 발행 후 예상 입금일이 지났는데 미입금인 프로젝트 목록
<Card className="border-red-200/50">
  <CardHeader>⚠️ 입금 지연 프로젝트</CardHeader>
  <CardContent>
    {overdueProjects.map(p => (
      <div key={p.id} className="flex justify-between text-sm py-1 border-b">
        <span>{p.name}</span>
        <span className="text-red-600">+{p.overdue_days}일 초과</span>
        <span className="font-bold">{p.amount.toLocaleString()}원</span>
      </div>
    ))}
    <div className="mt-3 text-xs text-slate-500">
      총 미수금: {totalReceivables.toLocaleString()}원
    </div>
  </CardContent>
</Card>
```

---

## 🗂️ 최종 파일 구조 요약

```
src/
├── entities/
│   ├── transaction/
│   │   └── api/get-monthly-stats.ts          ← 수정: excluded_from_personal 필터
│   ├── client/
│   │   └── api/get-client-lead-time.ts       ← 신규
│   └── project/
│       └── model/types.ts                    ← 수정: 입금 날짜 필드 추가
│
├── features/
│   ├── allocate-transaction/
│   │   └── ui/allocation-dialog.tsx          ← 수정: 이중 차단 토스트
│   ├── match-income/
│   │   └── (api 수정: actual_payment_date 기록)  ← 수정
│   └── refine-ledger/
│       └── api/
│           ├── suggest-category.ts           ← 신규
│           ├── apply-tagging-rules.ts        ← 신규
│           └── register-tagging-rule.ts      ← 신규
│
├── widgets/
│   └── receivables-alert/                    ← 신규 위젯
│       └── ui/ReceivablesAlertCard.tsx
│
└── app/(dashboard)/
    └── settings/
        └── tagging-rules/page.tsx            ← 신규 페이지
```

**수정되는 기존 파일:**
```
supabase/migrations/20260311_sprint2_tagging_and_tracking.sql   ← 신규
src/app/(dashboard)/settings/recurring-expenses/page.tsx        ← 구독 사업비 색상 분리 + 합계 카드
src/app/(dashboard)/transactions/unclassified/page.tsx          ← 스마트 태깅 추천 UI
src/widgets/transaction-history/ (관련 컴포넌트)                 ← excluded 항목 취소선 표시
src/widgets/business-dashboard/ui/BusinessDashboard.tsx         ← ReceivablesAlertCard 추가
src/features/manage-daily-rate/ui/DailyRateTable.tsx            ← (변경 없음)
```

---

## ✅ 구현 체크리스트 (Antigravity용)

### Phase 0: DB 마이그레이션
- [ ] `20260311_sprint2_tagging_and_tracking.sql` 실행
- [ ] `npx supabase gen types` 재실행

### Phase 1: 이중 지출 차단 (M-3)
- [ ] `excluded_from_personal` 필터를 `get-monthly-stats.ts`에 적용
- [ ] 기존 Supabase RPC 함수 (`get_filtered_transactions` 등) 동일 필터 적용
- [ ] `allocation-dialog.tsx`에 사업비 전환 시 토스트 추가
- [ ] `transaction-history`에서 excluded 항목 회색+취소선 표시

### Phase 2: 구독 사업비 분리 (S-7)
- [ ] `/settings/recurring-expenses` 색상 레이어 분리 (blue/green 보더)
- [ ] 사업비/개인 합계 + 매입세액 공제 카드 추가
- [ ] 구독 등록 시 키워드 기반 `is_business` 자동 추천

### Phase 3: 스마트 태깅 Lite (S-1)
- [ ] `suggest-category.ts` API 구현 (3단계 룰 엔진)
- [ ] `apply-tagging-rules.ts` API 구현 (일괄 적용)
- [ ] `register-tagging-rule.ts` API 구현
- [ ] `/transactions/unclassified` 추천 배지 + 자동 적용 버튼
- [ ] `/settings/tagging-rules` 룰 관리 페이지 신규 생성
- [ ] 룰 등록 제안 토스트 (5건 이상 동일 가맹점)

### Phase 4: 입금 지연 추적 (S-2)
- [ ] `project/model/types.ts`에 날짜 필드 추가
- [ ] `get-client-lead-time.ts` API 구현
- [ ] `match-income` 완료 시 `actual_payment_date` 자동 기록
- [ ] 프로젝트 상세에 입금 일정 섹션 추가
- [ ] `ReceivablesAlertCard` 위젯 신규 생성
- [ ] `BusinessDashboard`에 위젯 추가

### Phase 5: 검증
- [ ] 거래를 사업비로 태깅 → 가계부 지출 합계에서 즉시 차감되는지 확인
- [ ] 사업비 태깅 해제 → 가계부 합계 복원되는지 확인
- [ ] Adobe 구독 등록 시 is_business 자동 체크 제안 확인
- [ ] 미분류 페이지에서 "룰 자동 적용" 클릭 → 기존 룰 매칭 건수 정확한지 확인
- [ ] 입금 매칭 완료 후 `actual_payment_date` 기록 + 리드타임 계산 확인
- [ ] 예상 입금일 초과 프로젝트가 `ReceivablesAlertCard`에 노출 확인

---

## 💡 구현 참고 — 기존 코드 재활용 포인트

| 신규 기능 | 재활용 가능한 기존 코드 |
|-----------|------------------------|
| 이중 지출 차단 | `allocation-dialog.tsx` 로직, `get-monthly-stats.ts` 쿼리 패턴 |
| 구독 사업비 분리 | `RecurringExpense` 타입의 `is_business` 컬럼 (이미 존재) |
| 스마트 태깅 | `mdt_allocation_rules` 테이블 + `bulk-assigner.tsx` UI 패턴 |
| 입금 지연 추적 | `match-income` 기존 플로우 + `projects` 테이블 확장 |
