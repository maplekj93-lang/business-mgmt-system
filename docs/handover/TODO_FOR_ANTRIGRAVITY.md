# TODO for Antigravity: Phase 1 전체 작업 흐름 (예상 소요 시간: 4~5시간)

이 문서는 사용자의 지시에 따라 Antigravity가 기계적으로 순차 진행해야 할 작업 목록 및 상태를 관리하는 문서입니다.

각 작업을 완료할 때마다 문서 상의 체크박스를 `[x]`로 변경하십시오.

## 전체 작업 목표
*   수정 방식: **거래내역 자체에 `owner_type` 컬럼을 개별 할당하는 독립 소유자 모델 (옵션 B)** 구현
*   목적: 공통 카드 결제 건도 개별 내역마다 누구의 지출인지 분리할 수 있도록 함. (미분류 내역 정리의 기반 구축)

---

## 작업 체크리스트

### 1. 설계 및 계획 수립 (완료)
- [x] 스키마 방향성 결정 문서 작성 (`research.md`)
- [x] 세부 구현 가이드라인 작성 (`IMPLEMENTATION_GUIDE.md`)
- [x] 데이터 정리 스크립트/가이드 작성 (`UNCLASSIFIED_CLEANUP_GUIDE.md`)
- [x] 현재 TODO 문서 작성 (`TODO_FOR_ANTRIGRAVITY.md`)

### 2. 백엔드(Supabase) 스키마 변경 및 API 대응
- [x] **2.1. DB Migration 스크립트 작성 (SQL)**
  - `supabase/migrations/` 폴더에 `transactions` 테이블에 `owner_type` 컬럼을 추가하고, 기존 `asset` 기반으로 데이터를 복제하는 SQL 마이그레이션 파일 추가.
- [x] **2.2. Frontend Type 정의 수정**
  - `src/entities/transaction/model/schema.ts`의 zod 스키마 및 타입에 `owner_type` 추가 (자산 스키마의 `OwnerType` 차용).
- [x] **2.3. RPC 함수 수정 (SELECT 보강)**
  - `get_filtered_transactions` RPC 로직 덤프 및 수정 쿼리 작성 (반환 테이블/타입에 `t.owner_type` 포함하도록).
  - 로컬 Supabase DB에 변경사항 적용(`psql` 또는 SQL runner 활용).
- [x] **2.4. Fetch API 수정**
  - `src/entities/transaction/api/get-transactions.ts`에서 RPC 호출 결과의 `tx_owner_type`을 UI 모델에 매핑하는 과정 통합.

### 3. UI 컴포넌트 구현 (TransactionTable)
- [x] **3.1. 소유자 표시 렌더링 수정**
  - `src/widgets/transaction-history/ui/transaction-table.tsx`의 "소유자" 열에 `tx.owner_type` 매핑 데이터 렌더링하도록 변경 및 CSS 처리(kwangjun -> '광준' 등).
- [x] **3.2. Update Transaction Action 수정**
  - `src/features/refine-ledger/api/update-transaction.ts`에서 자산 ID 외에 `ownerType`을 인자로 받아 DB `owner_type`을 직접 업데이트하도록 액션 함수 개정.
- [x] **3.3. 소유자 변경 Popover UI 추가**
  - 기존 자산 선택 Dropdown처럼, "소유자" 뱃지를 클릭하면 소유자 목록을 띄우고 `updateTransactionAction`으로 즉시 변경되는 UI 인터랙티브 적용.

### 4. 데이터 정상화 스크립트 실행 (81건 정리 적용)
- [x] **4.1. UNCLASSIFIED_CLEANUP_GUIDE SQL 실행**
  - 자산(`asset_id`) 자동 재매핑 및 기본 소유자 할당 쿼리(`UPDATE public.transactions ...`)를 작성하여 실행.
  - 미분류, 소유자 null 등 이상 데이터 점검 및 복구 스크립트 Supabase 터미널/SQL 통해 직접 실행 및 결과(`COUNT`) 검증.

### 5. 빌드 시스템 확인 및 마무리
- [x] **5.1. 컴파일 에러 체크**
  - `npm run build` 또는 `npm x tsc --noEmit` 실행하여 타입 안전성 및 빌드 가능 여부 확인(에러시 수정 반영).
- [ ] **5.2. 최종 런타임 검증 확인 요구**
  - 런타임 결과물(로컬 브라우저 UI 및 수정 반영 확인)을 사용자에게 테스트 요청 (메모 및 안내 작성).

---

> **Antigravity 지시사항:**
> 본 문서를 확인한 후, "2. 백엔드 스키마 변경 및 API 대응" 작업부터 기계적으로 실행을 시작하겠습니다. 작업을 진행하며 본 파일의 상태를 업데이트하십시오.
