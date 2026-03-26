# 🛠 Engineering Manager Review: Phase 5 (Advanced Analytics)

## 1. 아키텍처 및 FSD 규정 (FSD Compliance)

### 📂 레이어 적정성 검토
- **Widgets (`widgets/`)**: `CategoryDonutChart`, `ProjectProfitabilityTable`, `AgingReceivablesWidget`. 
  - 복잡한 데이터 페칭과 시각화 로직이 결합된 독립적인 비즈니스 블록이므로 Widget 레이어가 적합합니다.
- **Entities (`entities/project/api`)**: `get-project-profitability.ts`. 
  - 도메인 핵심 계산 로직(Tax-adjusted)은 Entity 레이어에 배치하여 재사용성을 높입니다.
- **Shared (`shared/ui`)**: `OwnerToggle`. 
  - 범용적인 필터 UI로서 Shared 레이어로 설계합니다.

### 🚫 의존성 규칙
- 모든 새 컴포넌트는 단방향 의존성을 준수하며, `features` 레이어에서 위젯을 호출하는 역참조가 없도록 합니다.

---

## 2. 데이터 모델 & 타입 안정성 (Data & Type Safety)

### 🧮 정밀 계산 로직
- 부가세(10%) 및 원천세(3.3%) 계산 시 자바스크립트 부동소수점 오차 방지를 위해 `Math.round()` 또는 `Intl.NumberFormat`을 활용한 정수 기반 처리(Cents/Won 단위)를 기본으로 합니다.
- **Zod Schema**: 수익성 데이터를 위한 `ProjectProfitabilitySchema`를 정의하여 API 응답의 무결성을 보장합니다.

### 🔐 Supabase RLS
- `project_incomes`, `crew_payments`, `site_expenses` 테이블에 대해 `business_owner` 기반의 RLS 정책이 적용되어 있는지 최종 점검 후, API 개발 시 필터링을 병행합니다.

---

## 3. 에러 처리 및 퍼포먼스 (Error & Performance)

### 📑 서버 사이드 렌더링 (SSR)
- 대시보드와 리포트의 초기 데이터는 Next.js Server Components를 통해 SSR로 렌더링하여 첫 로딩 속도(LCP)를 최적화합니다.
- 오너 전환 시의 인터랙션은 URL Query Parameter(`?owner=euiyoung`)를 활용하여 캐시 밸리데이션(Revalidation)을 유도합니다.

### 🛑 실패 모드 대응 (Failure Modes)
1. **데이터 파편화**: 프로젝트 수입은 이번 달인데 비용은 다음 달인 경우 -> **Project-Centric(프로젝트 생애주기 수익성)** 뷰를 도입하여 기간에 구애받지 않는 손익을 볼 수 있게 합니다.
2. **권한 오류**: 오너 필터링 누락 시 -> API 레벨에서 `currentUser` 정보를 바탕으로 강제 필터링 로직을 삽입합니다.

---

## 🚀 최종 액션 플랜 승인 대기
위의 검토 사항을 바탕으로 `task.md`를 업데이트했습니다. 이 설계대로 진행할까요?
