# Design: 임포트 파이프라인 + 미분류 수신함 전면 재설계

## 시스템 아키텍처 개선

### 1. 가맹점명 정규화 (Normalization)
- **목적**: '스타벅스 강남점'과 '스타벅스 역삼점'을 동일 브랜드로 인식.
- **로직**: `parser.ts`에서 가맹점 지점명(강남점, 본점 등), 법인 표기((주), ㈜ 등), 특수 기호를 제거한 `normalized_name` 생성.
- **저장**: `transactions` 테이블의 `normalized_name` 컬럼에 저장.

### 2. 건별 처리 (Ungroupable Merchants)
- **대상**: 쿠팡, 배달의민족, 요기요, ATM 등 동일 가맹점명이라도 카테고리가 매번 달라지는 경우.
- **관리**: `ungroupable_merchants` 메타데이터 테이블에서 관리.
- **동작**: RPC 검색 시 `ungroupable_merchants`에 포함된 가맹점은 `is_groupable = false`로 마킹하여 그룹핑에서 제외.

### 3. 미분류 수신함 UI (Per-Item View)
- **그룹 행**: `is_groupable = true` 이며 동일 조건 2건 이상인 경우 기존처럼 그룹 행으로 표시.
- **개별 행**: `is_groupable = false` 이거나 단일 건인 경우 개별 행(`PerItemRow`)으로 표시.
- **인라인 편집**: 개별 행에서 카테고리와 입금자(Owner)를 즉시 수정 가능하도록 드롭다운 및 토글 UI 적용.

## 데이터 흐름
1. 익셀 업로드 → `parseExcel` (정규화 포함)
2. `importExcelTransactions` (asset ID 기반 `owner_type` 주입)
3. `uploadBatchAction` (DB 저장 및 신규 ID 반환)
4. `applyTaggingRules` (자동 분류 실행)
5. 미분류 수신함 접속 → `get_unclassified_stats` (그룹/건별 데이터 조회)
6. 사용자 확인 및 분류

## 고려 사항
- 기존 규칙 엔진과의 호환성 유지.
- `normalized_name`이 `description`을 대체하지 않고 보조 필드로만 활용되도록 설계.
