# Research: Currency Utility vs SQL RPC Logic Audit

`currency.ts` 유틸리티와 `get_project_profitability` RPC 간의 계산 로직 불일치에 대한 정밀 분석 결과입니다.

## 1. 개요
현재 프로젝트의 수익성 분석 로직이 백엔드(SQL)와 프론트엔드(JS)에서 서로 다른 기준을 사용하고 있음을 발견했습니다.

## 2. 로직 대조 분석

### A. SQL RPC (`get_project_profitability`)
- **수식**: `(Gross Revenue) - (Labor Cost) - (Expenses)`
- **특징**: 부가세(VAT 10%)를 별도로 차감하지 않고 총매출액 전체를 수익으로 간주합니다.
- **파일**: `20260325_project_profitability_rpc_v2.sql`

### B. JS Utility (`currency.ts`)
- **수식**: `(Net Revenue [Gross/1.1]) - (Labor Cost) - (Expenses)`
- **특징**: 총액에서 부가세를 먼저 제외한 '공급가액'을 기준으로 순이익을 산출합니다.
- **파일**: `currency.ts`

## 3. 발생 가능한 리스크
1. **데이터 불일치**: 동일한 프로젝트에 대해 대시보드 테이블(JS 계산)과 향후 도입될 수 있는 서버 기반 리포트(SQL 계산)의 결과값이 10% 이상 차이 날 수 있습니다.
2. **세무적 오해**: 부가세는 납부해야 할 세금이므로, 이를 포함하여 순이익을 계산하면 실제 가용 자금보다 더 높은 이익으로 오인될 수 있습니다.

## 4. 제안 사항
- **통일화**: 비즈니스 정책에 따라 하나로 통일해야 합니다. (일반적으로 부가세 제외 방식 권장)
- **중복 제거**: `ProjectProfitabilityTable`에서 RPC가 반환한 `net_profit`을 무시하고 재계산하는 부분을 제거하고, RPC 로직을 JS와 동일하게 수정하는 것이 효율적입니다.
