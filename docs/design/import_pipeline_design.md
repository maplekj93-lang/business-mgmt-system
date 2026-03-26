# Design: Import Pipeline — Parser 정상화 및 중복 방지 구조

## 1. 개요
7개 이상의 다양한 은행/카드/페이 엑셀 파일을 안정적으로 임포트하고, 임포트 후 자동 분류(Auto-tagging)를 수행하며, 사용자가 수동으로 수정한 카테고리가 자동 규칙에 의해 덮어씌워지지 않도록 보호하는 구조를 설계합니다.

## 2. 데이터베이스 변경 사항 (Migration)

`transactions` 테이블에 다음 컬럼을 추가합니다:
- `manual_override` (BOOLEAN, DEFAULT false): 사용자가 카테고리를 수동으로 지정했는지 여부. `true`인 경우 자동 규칙 적용 대상에서 제외됩니다.
- `raw_description` (TEXT, DEFAULT ''): 파서에서 추출한 정규화 전 원본 설명. 해시 생성 및 중복 체크의 안정성을 위해 사용됩니다.

## 3. 핵심 로직 설계

### A. 파서(Parser) 개선
- **Optional Chaining**: `parser.ts`의 `headers.findIndex` 로직에서 `h?.includes(k)`를 사용하여 `null/undefined` 셀에 의한 런타임 에러를 방지합니다.
- **키워드 유연화**: 
    - `bc-card.ts`: 개행문자(`\n`)가 포함된 헤더를 정규화하여 매칭하도록 개선.
    - `hyundai-card.ts`: 샘플 파일 구조(`승인일`, `가맹점명`, `승인금액`)에 맞춰 키워드 업데이트.
- **원본 설명 보존**: 모든 프로파일의 `parse` 과정에서 `raw_description`을 캡처하여 `ValidatedTransaction`에 포함시킵니다.

### B. 중복 체크 및 해시 로직
- `upload-batch.ts`에서 중복 방지 해시 생성 시, `description` 대신 `raw_description`을 우선 사용하도록 변경하여 파서 로직 변경(설명 정규화 등)으로 인한 해시 불일치 문제를 해결합니다.
- `hash = date | amount | raw_description | asset_id`

### C. 자동 태깅 및 수동 수정 보호
- **임포트 후 자동 실행**: `upload-batch.ts`의 insert 작업 완료 후, `insertedIds`를 인자로 `applyTaggingRules()`를 즉시 호출합니다.
- **수동 수정 시 플래그 설정**: `update-transaction.ts` API에서 카테고리(`category_id`) 업데이트 시 `manual_override = true`를 함께 저장합니다.
- **규칙 적용 시 필터링**: `apply-tagging-rules.ts`에서 규칙을 적용할 대상을 선정할 때 `.eq('manual_override', false)` 조건을 추가하여 사용자의 수동 수정을 보호합니다.

## 4. 확장성 고려
- 새로운 금융 소스 추가 시 `src/features/ledger-import/model/profiles/`에 프로파일 파일 하나만 추가하고 `index.ts`에 등록하는 구조를 유지합니다.
- 복잡한 로직이 필요한 경우 `transforms` 내의 `parseAmount`, `parseStatus` 등을 활용합니다.
