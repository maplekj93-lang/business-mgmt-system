# Research: 임포트 파이프라인 + 미분류 수신함 전면 재설계

## 개요
현재 임포트 및 미분류 거래 관리 시스템의 한계를 분석하고, 리서치 결과를 바탕으로 데이터 품질을 혁신하기 위한 방안을 도출합니다.

## 핵심 리서치 인사이트
- **카카오페이 Dual Excel Merge**: 현재 구현된 `kakao-pay-matcher` 방식이 최선이며 지속적 고도화 필요.
- **가맹점 성격에 따른 분류 전략**:
    - 쿠팡, 배달앱 등 품목이 매번 다른 가맹점은 그룹핑에서 제외하고 **건별 처리(per-item)** 강제.
    - 스타벅스 강남점 vs 스타벅스 역삼점 등 지점명 파편화는 **정규화(Normalization)**를 통해 해결.
- **자동화 강화**:
    - 임포트 시 `asset_id`를 기반으로 `owner_type`을 즉시 주입하여 '미상' 발생 억제.
    - 임포트 완료 즉시 `applyTaggingRules()`를 자동 실행하여 수동 작업 최소화.

## 현재 시스템 분석
- `importExcelTransactions.ts`: `assetId`를 받지만 `owner_type`을 조회/설정하지 않음.
- `ledger-import-widget.tsx`: 저장 후 `window.location.reload()`만 수행하며 자동 규칙 적용 로직 누락.
- `parser.ts`: 원본 가맹점명을 그대로 사용하며 정규화 필드(`normalized_name`)가 없음.
- `unclassified-row.tsx`: 모든 거래를 그룹 단위로만 렌더링하며, 건별 편집 UI가 부재함.

## 개선 방향
1. **DB 스키마**: `ungroupable_merchants` 테이블 추가 및 `transactions.normalized_name` 필드 도입.
2. **API**: `uploadBatchAction`이 삽입된 ID 목록을 반환하도록 개선.
3. **UI/UX**: 미분류 수신함에서 `is_groupable=false`인 경우 개별 행으로 표시하고 인라인 편집 지원.
