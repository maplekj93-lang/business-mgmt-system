# Project Tasks (Phase 4 & Technical Debt)

## [REF] Phase 0-3 기반 안정화 (CRITICAL)
- [x] `import_batches` 테이블 및 배치 로깅 구현
- [x] 해시 기반 중복 삽입 방지 로직 (`upload-batch.ts`)
- [x] 기존 중복 데이터 (~113건) 정리 완료 (SQL Function)
- [ ] 배치 롤백 취소 기능 (UI 추가 필요)

## [DONE] Phase 4 기본 UI (by Claude)
- [x] 프로젝트 센터 (`/business/projects`)
- [x] 일당 관리 테이블 (`DailyRateTable`)
- [x] BC카드 취소 거래 처리

## [TODO] Phase 4 고급 기능
- [x] 견적서 생성 및 인쇄/PDF 출력 (`CreateQuoteDialog` + `QuoteTemplate`, 프로젝트 상세 모달 연동 완료)
- [ ] 가계부 지출 → 프로젝트 사업비 태깅 UI
- [ ] 파이프라인 카드 - 실거래 입금 매칭 로직
- [ ] 통합 비즈니스 캐시플로우 캘린더 위젯

## [DONE] 실무 효율화 1순위 (Priority 1)
- [x] Task 1: 크루 구성별 원천징수 3.3% 자동 계산 (DB, API, UI 완료 및 검증)
- [x] Task 2: 수입 매칭 시 부가세 10% 단위 자동 추적/보유금 (DB, API, UI 완료 및 검증)
- [x] Task 3: 월정액 고정비/구독 관리 및 자동 기록 (DB 생성, API, UI 완료 및 검증)
