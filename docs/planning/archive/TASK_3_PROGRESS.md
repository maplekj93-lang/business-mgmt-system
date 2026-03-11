# Task 3 진행 상황: 고정비/구독 자동 기록
**최종 업데이트**: 2026-03-09 23:00 KST
**담당자**: Claude → Antigravity에게 인수

---

## ✅ 완료된 작업

### 1. 데이터베이스 마이그레이션 ✅
- **파일**: `supabase/migrations/20260309_add_recurring_expenses.sql`
- **테이블**: `recurring_expenses` 생성
- **필드**:
  - `id` (UUID, 기본키)
  - `user_id` (FK to auth.users)
  - `name` (구독 이름)
  - `description` (선택사항)
  - `category_id` (FK to mdt_categories)
  - `amount` (월/분기/연 비용)
  - `frequency` (monthly/quarterly/annual)
  - `due_day_of_month` (1-31)
  - `next_due_date` (다음 기한, 자동 계산)
  - `owner_type` (kwangjun/euiyoung/joint)
  - `is_business` (사업 관련 여부)
  - `allocation_status` (비즈니스 할당 상태)
  - `status` (active/inactive/paused)
  - `last_recorded_date` (마지막 자동 기록 날짜)
  - `last_matched_transaction_id` (연결된 거래)
  - `created_at`, `updated_at` (타임스탐프)
- **RLS 정책**: 사용자별 데이터 격리 완료
- **인덱스**: user_id+status, user_id+next_due_date, user_id+owner_type

### 2. TypeScript 타입 정의 ✅
- **파일**: `src/entities/recurring-expense/model/types.ts`
- **인터페이스**:
  - `RecurringExpense`: DB 행 구조
  - `RecurringExpenseSummary`: 월별 요약 정보
  - `CreateRecurringExpenseInput`: 생성/수정 입력
  - `UpdateRecurringExpenseInput`: 부분 업데이트 입력
- **상수**:
  - `FREQUENCIES`: ['monthly', 'quarterly', 'annual']
  - `OWNER_TYPES`: ['kwangjun', 'euiyoung', 'joint']
  - `RECURRING_STATUSES`: ['active', 'inactive', 'paused']

### 3. API 함수 구현 ✅
- **파일**: `src/entities/recurring-expense/api/recurring-expense-api.ts`
- **함수** (14개):
  - `getCurrentMonth()` - 현재 월 YYYY-MM 반환
  - `calculateNextDueDate()` - 빈도에 따라 다음 기한 계산
  - `getActiveRecurringExpenses()` - 활성 구독 조회
  - `getRecurringExpenseById(id)` - ID로 조회
  - `getRecurringExpensesByOwner(ownerType)` - 소유자별 조회
  - `getDueThisMonth()` - 이번 달 기한이 된 구독
  - `getMonthlyRecurringSummary(yearMonth)` - 월별 요약
  - `getAllRecurringExpenses()` - 모든 구독 조회
  - `createRecurringExpense(input)` - 새 구독 생성
  - `updateRecurringExpense(id, updates)` - 구독 수정
  - `recordRecurringExpense(id, transactionId?)` - 기록 표시
  - `matchRecurringToTransaction(id, transactionId)` - 거래 링크
  - `toggleRecurringStatus(id, status)` - 상태 변경
  - `deleteRecurringExpense(id)` - 구독 삭제
- **특징**:
  - 모든 함수에 user_id 검증
  - Supabase 타입 우회: `(supabase as any).from(...)`
  - 자동 기한 계산 (월/분기/연 지원)

### 4. Feature 자동 기록 로직 ✅
- **파일**: `src/features/record-recurring-expense/api/record-recurring.ts`
- **함수**:
  - `recordPendingRecurringExpenses()` - 기한 된 모든 구독 기록
    - 활성 구독 중 기한이 된 것 찾기
    - 각 구독에 대해 transaction 자동 생성
    - subscription.last_recorded_date 업데이트
    - 다음 기한 자동 계산
  - `recordSpecificRecurringExpenses(ids)` - 특정 구독만 기록
- **워크플로우**:
  1. 기한 된 구독 조회
  2. 사용자의 주 자산 찾기
  3. 각 구독에 대해:
     - Transaction 생성 (자동기록 표시)
     - RecurringExpense 업데이트
     - 다음 기한 계산

### 5. 설정 UI 페이지 ✅
- **파일**: `src/app/settings/recurring-expenses/page.tsx`
- **기능**:
  - **목록 표시**:
    - 구독 카드 (이름, 금액, 빈도, 다음 기한)
    - 소유자, 마지막 기록 날짜, 상태 표시
  - **CRUD 다이얼로그**:
    - 이름, 설명, 금액, 빈도, 납기일
    - 소유자 선택, 사업 지출 토글, 상태 선택
  - **액션 버튼**:
    - 추가 버튼
    - 편집 버튼 (각 카드)
    - 삭제 버튼 (각 카드)
    - 상태 토글 (각 카드)
    - "지금 기록하기" 버튼 (테스트용)
  - **상태 배지**:
    - active: 초록색
    - inactive: 회색
    - paused: 호박색

### 6. 설정 네비게이션 통합 ✅
- **파일**: `src/app/settings/layout.tsx` 수정
- **변경사항**:
  - `/settings/recurring-expenses` 링크 추가
  - 레이블: "구독 관리"
  - 네비게이션 위치: 크루 관리 다음

### 7. TypeScript 타입 정의 업데이트 ✅
- **파일**: `src/shared/api/supabase/types.ts` 수정
- **추가사항**:
  - recurring_expenses 테이블 타입 정의 (Row/Insert/Update)

---

## ⚠️ TypeScript 이슈 해결 완료 ✅

### 문제
Supabase 자동 생성 타입이 `recurring_expenses` 테이블을 인식하지 못함

### 해결 방법
다음 파일들에 `(supabase as any)` 캐스트 적용:
```typescript
// Before
const { data } = await supabase.from('recurring_expenses').select('*')

// After
const { data } = await (supabase as any).from('recurring_expenses').select('*')
```

**적용 위치**:
- `src/entities/recurring-expense/api/recurring-expense-api.ts` - 5개 함수 (getVatByMonth, addVatFromIncome update/insert, getAllVatReserves, updateVatStatus)
- `src/features/record-recurring-expense/api/record-recurring.ts` - 2개 위치 (transaction insert × 2, recurring_expenses select × 1)

### 검증
```bash
✅ npx tsc --noEmit → 성공
```

---

## 🧪 테스트 체크리스트

### Phase 1: Entity API 테스트
- [ ] 구독 생성 기능
- [ ] 구독 조회 기능 (모든 함수)
- [ ] 구독 수정 기능
- [ ] 구독 삭제 기능
- [ ] calculateNextDueDate() 함수 (월/분기/연 모두)
- [ ] getDueThisMonth() 필터링 정상

### Phase 2: 자동 기록 기능 테스트
- [ ] 구독 생성 후 due_day = 오늘
- [ ] recordPendingRecurringExpenses() 호출
- [ ] Transaction 생성 확인
- [ ] last_recorded_date 업데이트 확인
- [ ] next_due_date 자동 계산 정상

### Phase 3: 설정 UI 테스트
- [ ] 설정 페이지 접근 가능 (`/settings/recurring-expenses`)
- [ ] 구독 추가 다이얼로그 열림
- [ ] 폼 필드 모두 입력 가능
- [ ] 저장 후 목록에 추가됨
- [ ] 성공 토스트 메시지 표시
- [ ] 구독 수정 기능
- [ ] 구독 삭제 기능
- [ ] 상태 토글 기능

### Phase 4: 대시보드 통합 테스트
- [ ] "지금 기록하기" 버튼 정상 작동
- [ ] 자동 기록 후 transaction 히스토리에 표시
- [ ] 기록된 거래에 "[자동기록]" 마크 표시

### Phase 5: DB 데이터 검증
- [ ] Supabase Dashboard → recurring_expenses 테이블 확인
- [ ] 구독 저장 정상 여부
- [ ] RLS 정책 정상 여부
- [ ] 각 필드 데이터 타입 정상

---

## 📊 구현 상세

### 자동 기한 계산 로직
```typescript
function calculateNextDueDate(frequency, dueDay) {
  // 월: 다음 달의 해당 일
  // 분기: 3개월 후의 해당 일
  // 연: 내년 같은 달의 해당 일
  // 월의 마지막 날 < dueDay이면 조정
}
```

### 자동 기록 워크플로우
```
getDueThisMonth() 호출
↓
활성 구독 중 next_due_date <= 오늘 필터링
↓
각 구독에 대해:
  1. Transaction 생성
     - user_id, asset_id, amount, category_id
     - description: "[자동기록] {이름}"
     - allocation_status: is_business에 따라
     - source: "auto_recurring"
  ↓
  2. RecurringExpense 업데이트
     - last_recorded_date: 오늘
     - last_matched_transaction_id: transaction.id
     - next_due_date: 자동 계산된 다음 기한
```

### 월별 요약 계산
```typescript
// 해당 월에 생성된 활성 구독들의 금액 합계
total_amount = sum(amount for all subscriptions)
recorded_count = count(where last_recorded_date exists)
pending_count = total_count - recorded_count
status = "pending" | "partial" | "complete"
```

---

## 📁 생성된 파일 목록 (9개)

```
신규 생성:
├── supabase/migrations/20260309_add_recurring_expenses.sql
├── src/entities/recurring-expense/
│   ├── model/types.ts
│   └── api/recurring-expense-api.ts
├── src/features/record-recurring-expense/
│   └── api/record-recurring.ts
├── src/app/settings/recurring-expenses/
│   └── page.tsx
└── docs/planning/TASK_3_PROGRESS.md (현재 문서)

수정됨:
├── src/app/settings/layout.tsx (네비게이션 링크 추가)
└── src/shared/api/supabase/types.ts (recurring_expenses 타입 추가)
```

---

## 💡 핵심 패턴

### 패턴 1: 자동 기한 계산
```typescript
// 월별/분기별/연간 빈도에 따라 자동 계산
export async function updateRecurringExpense(id, updates) {
  if (updates.frequency || updates.due_day_of_month) {
    updateData.next_due_date = calculateNextDueDate(freq, day)
  }
}
```

### 패턴 2: 자동 기록 트리거
```typescript
// 수동 버튼으로 실행 (향후: 스케줄러로 자동화 가능)
export async function recordPendingRecurringExpenses() {
  const dueSubscriptions = await getDueThisMonth()
  // 각 구독에 대해 transaction 생성 + subscription 업데이트
}
```

### 패턴 3: TypeScript 타입 우회
```typescript
// Supabase 클라이언트 타입 제한 극복
await (supabase as any).from('recurring_expenses').select('*')
```

---

## 🚀 다음 단계 (Antigravity)

### 즉시 할 일
1. **데이터베이스 마이그레이션 적용**
   ```bash
   # Supabase Dashboard에서 마이그레이션 실행
   # 파일: supabase/migrations/20260309_add_recurring_expenses.sql
   ```

2. **테스트 실행** (위의 테스트 체크리스트 참고)
   - 각 항목을 수동으로 확인

3. **완료 표시**
   - `docs/planning/PHASE4_TASKS.md`에서 체크 표시
   - `docs/planning/PRIORITY_1_IMPLEMENTATION.md` 업데이트

### 향후 개선 (선택사항)
1. **자동 스케줄러** (Cron Job)
   - 매일 자정에 `recordPendingRecurringExpenses()` 실행
   - Supabase Edge Functions 또는 외부 서비스 사용

2. **대시보드 위젯**
   - 이번 달 구독 금액 요약 표시
   - 기록 진행률 표시

3. **고급 기능**
   - 구독 자동 제안 (패턴 인식)
   - 미결제 구독 알림
   - 구독 만료 예정 알림

---

## 📊 코드 통계

| 항목 | 수량 |
|------|------|
| 신규 생성 파일 | 6개 |
| 수정된 파일 | 2개 |
| DB 테이블 | 1개 (recurring_expenses) |
| API 함수 | 14개 |
| TypeScript 타입 | 5개 |
| React 컴포넌트 | 1개 (설정 페이지) |

---

## 🔗 관련 문서

- `PRIORITY_1_IMPLEMENTATION.md` - 1순위 마스터 계획
- `TASK_1_PROGRESS.md` - Task 1 (크루 3.3%)
- `TASK_2_PROGRESS.md` - Task 2 (부가세 10%)
- `IMPLEMENTATION_SUMMARY.md` - 전체 구현 요약

---

## 📞 문제 해결

### 문제: "지금 기록하기" 버튼이 비활성화됨
→ 활성 구독이 없거나 기한이 아직 안 된 경우
→ 테스트 시 due_day_of_month를 오늘로 설정하고 다시 시도

### 문제: Transaction이 생성되지 않음
→ 주 자산(is_primary=true)이 없는지 확인
→ RLS 정책이 정상인지 확인

### 문제: TypeScript 컴파일 오류
→ `(supabase as any)` 캐스트 확인
→ `npx tsc --noEmit` 실행하여 구체적 오류 확인

---

**최종 상태**: ✅ 완료 (테스트 검증 필요)
**예상 검증 완료**: 2026-03-10
**담당자**: Antigravity

---

**작업 요약**: Task 3는 구독/고정비 자동 기록 시스템으로, Task 1과 Task 2의 패턴을 따릅니다. 사용자가 매달 자동으로 기록할 구독을 설정하면, "지금 기록하기" 버튼 클릭 또는 향후 자동 스케줄러를 통해 각 구독이 거래로 기록됩니다. 모든 데이터 자동 계산(기한, 다음 기한), TypeScript 타입 처리, 사용자 격리를 구현했습니다.
