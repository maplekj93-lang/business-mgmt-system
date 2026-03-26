# Sprint 2: 가계부 운영 효율화 (Ledger Optimization & Smart Tagging)

본 Sprint는 현재 가계부 애플리케이션의 운영 효율화에 집중합니다. 비즈니스 전용 ERP 구축(Business Dashboard, 거래처 관리, 프로젝트 수익 추적 등)은 Phase 4에서 별도 라우트(/business/*)로 진행될 예정입니다.

## User Review Required

> [!IMPORTANT]
> **이중 지출 차단 적용**: 사업비로 분류된 거래는 가계부(개인 지출) 통계에서 자동으로 제외됩니다. 이는 순자산 통계의 정확성을 위한 조치입니다.

## Prerequisites (구현 시작 전 필수 완료)

1.  **DB 마이그레이션 실행**
    *   SQL: `supabase/migrations/20260311_sprint2_tagging_and_tracking.sql` (또는 수동 실행)
2.  **TypeScript 타입 재생성**
    ```bash
    npx supabase gen types typescript --project-id <project-id> > src/shared/api/supabase/database.types.ts
    ```
3.  **필수 컬럼 확인**
    *   `transactions`: `excluded_from_personal` (boolean)
    *   `mdt_allocation_rules`: `is_business`, `business_tag`, `match_type`, `priority`
    *   `projects`: `invoice_sent_date`, `expected_payment_date`, `actual_payment_date`

---

## Proposed Changes

### 1. 이중 지출 차단 (Double-Count Prevention)
사업비 태깅 시 가계부 지출 합계에서 자동 제외되는 로직을 구현합니다.

- #### [MODIFY] src/entities/transaction/api/get-monthly-stats.ts
  - `mode: 'personal'`인 경우 `excluded_from_personal = false` 필터 추가.
- #### [MODIFY] src/features/allocate-transaction/ui/allocation-dialog.tsx
  - 사업비 전환 시 "가계부에서 제외됨" 안내 토스트 추가.
- #### [MODIFY] src/widgets/transaction-history/ui/TransactionRow.tsx (및 관련 컴포넌트)
  - `excluded_from_personal` 항목에 대해 시각적 구분(취소선/회색조) 적용.

---

### 2. 구독 사업비 정밀 관리 (Subscription Refinement)
구독 항목의 사업비/개인 분리 및 세액 공제 통계를 강화합니다.

- #### [MODIFY] src/app/(dashboard)/settings/recurring-expenses/page.tsx
  - 사업비(Blue)와 개인(Green) 레이어를 시각적으로 강제 분리.
  - 상단에 "사업용 구독 월 합계" 및 "매입세액 공제 가능액" 통계 카드 추가.

---

### 3. 스마트 태깅 Lite & 룰 관리 (Smart Tagging V2)
사용자가 직접 분류 규칙을 관리하고, 높은 신뢰도의 항목을 자동 분류합니다.

- #### [NEW] src/app/(dashboard)/settings/tagging-rules/page.tsx
  - `mdt_allocation_rules`를 관리할 수 있는 신규 페이지 구축.
- #### [MODIFY] src/app/(dashboard)/transactions/unclassified/page.tsx
  - '룰 자동 적용' 버튼 추가 (Confidence: High 항목 즉시 처리).
  - 분류 확정 시 "동일 가맹점 룰 등록" 제안 팝업/토스트 추가.

---

### 4. 입금 지연 추적 (Lead-Time Tracker) — Sprint 2 범위 한정
예상 입금일이 지난 프로젝트를 경고하고 기본적 입금 추적을 구현합니다.

- #### [MODIFY] src/entities/project/model/types.ts
  - `invoice_sent_date`, `expected_payment_date`, `actual_payment_date` 필드 추가.
- #### [NEW] src/widgets/receivables-alert/ui/ReceivablesAlertCard.tsx
  - 예상 입금일이 지난 프로젝트를 경고하는 대시보드 위젯.
- #### [MODIFY] src/app/(dashboard)/page.tsx (또는 메인 대시보드 위젯)
  - 신규 위젯 통합 및 레이아웃 조정.

---

## Verification Plan

### Automated Verification
```bash
# TypeScript 컴파일 및 타입 체크
npm run type-check

# 빌드 검증
npm run build
```

### Manual Verification (기능별)

#### 1. 이중 지출 차단
- **테스트**: 거래를 "사업비"로 분류 후 대시보드 개인 지출 합계가 즉시 감소하는지 확인.
- **기준**: DB `excluded_from_personal` 컬럼이 `true`로 업데이트되는가?

#### 2. 구독 사업비 관리
- **테스트**: 사업용 구독 추가 시 매입세액 공제액(금액/11) 계산 정확성 확인.
- **기준**: 사업/개인 레이어가 시각적으로(색상 등) 명확히 분리되는가?

#### 3. 스마트 태깅 V2
- **테스트**: `/settings/tagging-rules`에서 규칙 생성 후 미분류 내역에서 자동 분류가 작동하는지 확인.
- **기준**: Priority 및 Match Type(Exact/Contains)에 따른 우선순위가 지켜지는가?

#### 4. 입금 지연 추적
- **테스트**: 입금 예정일이 지난 프로젝트가 대시보드 위젯에 경고로 노출되는지 확인.
- **기준**: 입금 완료 매칭 시 `actual_payment_date`가 자동 기록되는가?
