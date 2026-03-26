# Ledger History & UX Expansion (Phase 2)

이 계획은 사용자의 요청에 따라 가계부의 '전체 내역' 보기 기능을 추가하고, 시간 기반 필터(오늘, 이번 주, 예정) 및 미분류 내역의 시인성을 개선하기 위한 계획입니다.

## User Review Required

> [!IMPORTANT]
> **'지출 예정' 내역의 정의**
> 현재 시스템의 `recurring_expenses`(고정 지출) 테이블 데이터를 기반으로 이번 달 남은 기간 동안 발생할 예정인 항목들을 '전체 내역'에 함께 표시할 예정입니다. 실제 거래가 아닌 '예정' 데이터임을 구분하기 위해 별도의 UI 처리가 필요합니다.

## Proposed Changes

### 1. Database Layer (RPC Update)

#### [MODIFY] [20260303_update_filtered_transactions_rpc.sql](file:///Users/kwang/Desktop/business-mgmt-system/supabase/migrations/20260303_update_filtered_transactions_rpc.sql)
- `get_filtered_transactions` 함수가 `p_date_filter` (text) 매개변수를 추가로 받도록 수정합니다.
- 'today', 'this_week', 'scheduled' 필터 로직을 SQL 내부에 구현합니다.

### 2. Entity & API Layer

#### [MODIFY] [get-transactions.ts](file:///Users/kwang/Desktop/business-mgmt-system/src/entities/transaction/api/get-transactions.ts)
- `GetTransactionsParams`에 `dateFilter` 옵션을 추가하고 RPC 호출 시 전달합니다.

#### [MODIFY] [get-transactions-by-ids.ts](file:///Users/kwang/Desktop/business-mgmt-system/src/entities/transaction/api/get-transactions-by-ids.ts)
- (이미 `description` 포함되어 있음 확인됨)

### 3. Feature & UI Layer (UX Improvement)

#### [MODIFY] [transaction-detail-panel.tsx](file:///Users/kwang/Desktop/business-mgmt-system/src/features/refine-ledger/ui/transaction-detail-panel.tsx)
- 개별 거래 내역 테이블에 '상세 가맹점명(Description)' 컬럼을 추가합니다.

#### [MODIFY] [transaction-detail-sheet.tsx](file:///Users/kwang/Desktop/business-mgmt-system/src/features/refine-ledger/ui/transaction-detail-sheet.tsx)
- 모바일 상세 시트에서 가맹점명을 강조하여 표시합니다.

#### [MODIFY] [filter-bar.tsx](file:///Users/kwang/Desktop/business-mgmt-system/src/features/filter-transactions/ui/filter-bar.tsx)
- '오늘', '이번 주', '예정' 버튼 필터를 추가합니다.

### 4. Navigation & Page Layer

#### [NEW] [/transactions/history/page.tsx](file:///Users/kwang/Desktop/business-mgmt-system/src/app/(dashboard)/transactions/history/page.tsx)
- `TransactionHistoryWidget`을 사용하여 전체 내역을 보여주는 전용 페이지를 생성합니다.

#### [MODIFY] [page.tsx](file:///Users/kwang/Desktop/business-mgmt-system/src/app/(dashboard)/transactions/page.tsx)
- 루트 경로 접근 시 `/transactions/history`로 리다이렉트되도록 수정합니다.

#### [MODIFY] [sidebar.tsx](file:///Users/kwang/Desktop/business-mgmt-system/src/widgets/sidebar/ui/sidebar.tsx)
- 사이드바 메뉴에 '전체 내역'을 추가하고 '미분류 내역'과 형제 노드로 배치합니다.

## Verification Plan

### Automated Tests
- `npx tsc --noEmit`을 통한 타입 체크.
- 필터 변경 시 URL 파라미터가 올바르게 업데이트되는지 확인.

### Manual Verification
1. **가맹점명 확인**: 미분류 내역 상세 클릭 시 어디서 결제했는지(description)가 명확히 보이는가?
2. **필터 동작**: '오늘' 버튼 클릭 시 당일 내역만 필터링되는가?
3. **네비게이션**: '가계부' 메뉴 클릭 시 전체 내역이 기본으로 나타나는가?
