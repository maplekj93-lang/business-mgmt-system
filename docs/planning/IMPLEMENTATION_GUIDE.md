# 거래내역/사용내역 소유자 배정 로직 구현 가이드 (Phase 1)

이 문서는 `research.md`에서 결정된 **"옵션 B: 거래내역 독립 소유자 모델"**을 기반으로 `business-mgmt-system`에 소유자 배정 로직을 도입하기 위한 단계별 구현 계획 및 지침입니다.

## 1. 아키텍처 변경 요약

*   **현재**: 거래내역(`transactions`)은 소유자 정보를 가지고 있지 않으며, 연결된 자산(`asset_id`)의 `owner_type`을 통해 간접적으로 소유자를 추론하는 구조였습니다.
*   **변경 후**: 거래내역 테이블에 `owner_type` 컬럼을 직접 추가합니다. 내역 생성 시 자산의 소유자를 기본값으로 복사하지만, 이후 사용자가 UI에서 자산과 무관하게 거래내역의 소유자만 독립적으로 변경할 수 있습니다.

## 2. 상세 구현 절차 (Phase 1-1 ~ 1-5)

### Phase 1-1: DB 스키마 업데이트 (Migration)

`transactions` 테이블에 `owner_type` 컬럼을 추가하고, 기존 데이터의 소유자 정보를 자산 기준으로 마이그레이션합니다.

**SQL 마이그레이션 스크립트 (`supabase/migrations/20260305_add_owner_to_transactions.sql`)**

```sql
-- 1. transactions 테이블에 owner_type 컬럼 추가 (null 허용, 기본값 없음)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS owner_type TEXT;

-- 2. 기존 transactions 데이터 마이그레이션 (연결된 자산의 owner_type으로 업데이트)
UPDATE public.transactions t
SET owner_type = a.owner_type
FROM public.assets a
WHERE t.asset_id = a.id
  AND t.owner_type IS NULL;

-- 3. 자산이 없는 내역에 대한 기본 소유자 설정 (선택적)
-- 예: 미분류 내역은 '미상(other)' 혹은 특정 기본값으로 지정
UPDATE public.transactions
SET owner_type = 'other'
WHERE owner_type IS NULL;
```

### Phase 1-2: 백엔드 타입 및 API 수정

TypeScript 스키마와 데이터를 가져오는 RPC 함수, 업데이트 액션을 수정합니다.

**변경 대상 파일 목록:**
*   `src/entities/transaction/model/schema.ts`
*   `src/entities/asset/model/schema.ts` (OwnerTypeSchema 재사용 확인)
*   `supabase/migrations/2026xxxx_update_filtered_transactions_rpc.sql` (RPC 반환값에 `tx_owner_type` 포함)
*   `src/entities/transaction/api/get-transactions.ts`
*   `src/features/refine-ledger/api/update-transaction.ts`

**주요 수정 내용:**
1.  **스키마 (`schema.ts`)**: `Transaction` 타입에 `owner_type: OwnerTypeSchema.optional().nullable()` 추가.
2.  **RPC 업데이트 (`get_filtered_transactions`)**: `SELECT` 절에 `t.owner_type as tx_owner_type` 추가 (단, 기존 자산의 `owner_type` 매핑과 충돌하지 않도록 별칭 활용 주의).
3.  **데이터 패칭 (`get-transactions.ts`)**: RPC 결과에서 `tx_owner_type`을 파싱하여 UI 모델로 전달.
4.  **업데이트 API (`update-transaction.ts`)**: `ownerType` 파라미터를 받아 DB의 `owner_type`을 직접 업데이트하는 로직 추가 (`asset_id` 변경과 분리).

### Phase 1-3: UI 컴포넌트 수정 (TransactionTable)

UI에서 소유자를 표시하고, 변경할 수 있는 컨트롤을 추가합니다.

**변경 대상 파일 목록:**
*   `src/widgets/transaction-history/ui/transaction-table.tsx`

**주요 수정 내용:**
1.  **데이터 바인딩**: 기존 `tx.owner` (아마도 더미 값이거나 자산에서 가져온 값) 대신 명확하게 `tx.owner_type`을 소유자 뱃지에 렌더링하도록 수정.
2.  **소유자 렌더링 유틸리티**: `kwangjun` -> `광준`, `joint` -> `공동` 등 읽기 쉬운 라벨로 변환하는 함수 적용.
3.  **소유자 수정 Popover 추가**: 기존 '자산' 뱃지 위에 있던 Popover처럼, '소유자' 뱃지를 클릭하면 소유자 목록을 선택하여 변경하는 UI 추가 유도.
4.  **연동 로직**: 소유자 선택 시 `updateTransactionAction`을 호출하여 소유자만 변경 (자산 변경 로직과 분리 또는 통합 컴포넌트 활용).

### Phase 1-4: 내역 등록(Import) 로직 보완

새로운 거래내역 엑셀 업로드 시 `owner_type`도 함께 처리해야 합니다.

**변경 대상 파일 목록 (필요 시):**
*   데이터 임포트 관련 액션 로직 (ex: `src/features/import-transactions/api/...`)

**주요 수정 내용:**
*   초기 임포트 시 자산이 매핑되면 자산의 소유자를 트랜잭션의 소유자로 기본 세팅하도록 백엔드 또는 API 단계에서 처리 (DB Trigger 활용도 고려 가능하나, 로직의 명시성을 위해 API 단에서 처리 권장).

### Phase 1-5: 검증 및 테스트 체크리스트

1.  [ ] DB 마이그레이션 스크립트를 수동으로 실행하고 에러가 없는지 확인.
2.  [ ] `owner_type` 필드가 포함된 상태로 전체 거래내역이 정상 조회되는지 확인 (API 응답 점검).
3.  [ ] UI에서 기존 "미상" 대신 마이그레이션된 소유자가 올바르게 배지로 렌더링되는지 확인.
4.  [ ] UI에서 "소유자" 배지를 클릭하여 다른 사람으로 변경했을 때 DB에 `owner_type`만 성공적으로 변경되는지 테스트.
5.  [ ] 자산이 `null`인 상태에서도 소유자만 독립적으로 지정 가능한지 테스트.

---

다음 작업 지침서인 `UNCLASSIFIED_CLEANUP_GUIDE.md`를 참고하여 기존 미분류 내역의 소유자도 정리하십시오.
