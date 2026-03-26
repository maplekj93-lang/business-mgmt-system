# Handover Document: Phase 2-3 Advanced Implementation & Optimization

이 문서는 Antigravity가 수행한 Phase 2-3 작업 내용을 다른 협업 엔티티(Claude 등)가 신속히 파악하고 후속 작업을 이어갈 수 있도록 정리한 인수인계서입니다.

## 1. 프로젝트 현재 상태 (Project Status)
- **Current Version**: v0.2.2
- **Main Branch**: 모든 Phase 2-3 작업 및 Phase 5 선행 위젯 작업이 `main`에 병합됨.
- **Deployment**: `origin/main`에 푸시 완료.

## 2. 작업 핵심 요약 (Key Work Summary)

### A. 임포트 엔진 (Ledger Import Engine)
- **중복 방지**: `import_hash` (date + asset_id + amount + description)를 생성하여 DB 레벨에서 `ignoreDuplicates: true`로 처리.
- **청크 처리**: 150개 단위로 청크를 나누어 처리하며, 부분 실패 시에도 전체 중단 없이 진행 (실패 건은 `skipped` 처리).
- **고급 분류**: `suggestCategoryBulk` API를 통해 과거 매칭 이력 기반 카테고리 추천 기능 탑재.

### B. 수익성 계산 (Profitability Logic)
- **VAT 제외**: 모든 매출액은 공급가액(Amount / 1.1) 기준으로 계산되도록 RPC 및 클라이언트 로직 통일.
- **주요 RPC**: `get_project_profitability`, `get_dashboard_stats` 등이 업데이트됨.

### C. ERP & 위젯 (Phase 4-5)
- **스키마**: `business_profiles`, `mdt_daily_rate_logs`, `mdt_site_expenses` 등 페이즈 4/5용 테이블 및 RLS 구축 완료.
- **위젯**: `MatchIncomeDialog`, `DailyRateLogsWidget`, `SiteExpensesWidget` 등 수입/지출 매칭 UI 구현.

## 3. 기술적 주의사항 (Technical Gotchas)
- **Supabase Mocking**: 테스트 시 `.upsert().select()` 체이닝을 지원하기 위해 `query` 객체를 반환하는 모킹 구조를 사용함. (`importExcelTransactions.test.ts` 참조)
- **비즈니스 할당**: `import_hash` 생성 시 비즈니스 키워드 규칙이 있으면 `allocation_status`를 `business_allocated`로 자동 설정함.
- **Next.js 15**: 서버 컴포넌트의 `params` 접근 시 `await`가 필요함 (이미 대부분 조치됨).

## 4. 후속 작업 제언 (Next Steps)
- **Phase 6 예측 엔진**: 현재 축적된 매칭 데이터를 기반으로 미래 현금 흐름을 예측하는 기능 개발 필요.
- **UI 폴리싱**: 신규 추가된 ERP 위젯들의 다크 모드 및 반응형 레이아웃 세부 조정.
- **추가 테스트**: 실제 현장에서 발생하는 대용량(1000건 이상) 엑셀 파일에 대한 부하 테스트.

---
**작성자**: Antigravity (Advanced Agentic Coding AI)
**작성일**: 2026-03-27
