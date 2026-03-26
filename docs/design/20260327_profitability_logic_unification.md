# Design: Profitability Logic Unification

수익성 분석 로직의 일관성을 확보하고 시스템 효율성을 높이기 위한 설계안입니다.

## 1. 목표
- 백엔드(SQL RPC)와 프론트엔드(JS Utility)의 계산 로직을 '공급가액(Net Revenue) 기준'으로 통일.
- 프론트엔드에서의 중복 계산 제거 및 서버 데이터 직접 사용.

## 2. 세부 설계내용

### A. SQL RPC 수정 (`get_project_profitability`)
- 매출액에서 부가세를 제외한 공급가액을 먼저 산출하도록 수정.
- `net_profit = (revenue / 1.1) - labor_cost - expenses`
- `profit_margin = (net_profit / (revenue / 1.1)) * 100`

### B. 프론트엔드 연동 수정 (`ProjectProfitabilityTable.tsx`)
- `calculateProjectNetProfit` 및 `calculateProfitMargin`을 프론트엔드에서 호출하지 않고, RPC가 반환한 `net_profit` 및 `profit_margin`을 즉시 바인딩.

## 3. 기대 효과
- **신뢰도 향상**: 어느 시점에서 데이터를 확인하더라도 동일한 지표 제공.
- **성능 개선**: 프론트엔드 `map` 루프 내에서의 부하 감소.
- **유지보수 용이성**: 로직 변경 시 SQL 한 곳만 수정하면 전체 반영.
