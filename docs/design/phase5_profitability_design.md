# Phase 5: Profitability Analysis & Dashboard Design

Phase 5는 단순한 데이터 나열을 넘어, 비즈니스의 **수익성 무결성(Integrity)**과 **오너 간 균형(Balance)**을 시각화하는 '전략적 대시보드'로의 진화를 목표로 합니다.

## 1. 정밀 통화 연산 (`currency.ts` & `decimal.js`)

기본 자바스크립트 `Number` 타입의 부동 소수점 오차를 방지하기 위해 `decimal.js`를 전역 통화 연산 표준으로 채택합니다.

### 주요 유틸리티 (Proposed)
- `calcNetProfit(revenue, labor, expense)`: VAT(10%)를 제외한 공급가액 기준으로 순수익 계산.
- `toWon(value)`: 1원 단위 절사 및 콤마 포맷팅.
- `calcMargin(revenue, profit)`: 수익률(%) 계산.

## 2. 데이터 무결성 가드레일 (`integrity.ts`)

프로젝트 수익성이 비정상적으로 높게 측정되는 경우(예: 인건비가 0원인 경우)를 감지하여 사용자에게 알립니다.

### 검증 규칙
- **인건비 누락**: 프로젝트 상태가 '작업완료' 이상임에도 크루 인건비가 0원인 경우.
- **경비 누락**: 현장 촬영 프로젝트임에도 '주차비/식비' 등 필수 경비 카테고리의 지출이 없는 경우.

## 3. 신규 위젯 아키텍처

### `ProfitBalanceCard`
- **목표**: '전체' 오너 뷰에서 '광준'과 '의영'의 수익 비중을 시각화.
- **UI**: 듀얼 프로그레스 바 또는 비교 차트. 한쪽의 수익이 임계값(예: 30%) 이하로 떨어질 경우 '수익 불균형' 경고 표시.

### `ProfitabilityAlert`
- **목표**: 적자 또는 초저수익(Margin < 15%) 프로젝트를 대시보드 최상단에 고정.
- **기능**: 클릭 시 해당 프로젝트의 비용 입력 페이지로 즉시 이동.

## 4. 데이터 흐름 (Advanced)

1.  **Supabase RPC**: `get_project_profitability`가 프로젝트별 기본 수치(매출, 인건비, 경비) 반환.
2.  **Logic Layer**: `integrity.ts`가 반환된 데이터를 스캔하여 경고 플래그 생성.
3.  **UI Layer**: `ProjectProfitabilityTable`이 `decimal.js`로 최종 수익을 계산하고, 경고 플래그가 있는 행에 시각적 효과(Pulse Anim) 적용.
