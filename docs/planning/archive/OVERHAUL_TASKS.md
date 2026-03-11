# Dashboard & Architecture Overhaul Task List

## Status: In Progress

- [x] Phase 1: Navigation Overhaul (Sidebar & FAB)
- [x] Phase 2: Dashboard Redesign (50:50 Layout)
- [x] Phase 3: Supabase Type Safety (Remove `as any`)
  - [x] `database.types.ts` 업데이트 (import_batches, transactions 필드 추가)
  - [x] 수동 타입 정의(`src/shared/api/supabase/types.ts`) 제거 및 통합
  - [x] API 호출부 `as any` 제거 및 타입 바인딩 (RPC, Bulk, Import 등)
- [x] Phase 4: DB 마이그레이션 확인 및 최종 검증
- [x] Phase 5: 라우팅 구조 전면 개편 (Dashboard Route Grouping)
  - [x] 메인 및 주요 메뉴 (dashboard) 그룹으로 이동
  - [x] 페이지별 중복 Header 및 래퍼 제거
- [x] Phase 6: 0원 거래 데이터 정제 (Data Cleanup)
  - [x] DB 내 기존 0원 거래 내역 일괄 삭제
  - [x] 데이터 임포트 로직에서 0원 필터링 가드 추가
  - [x] 미분류 내역 집계 로직에서 0원 제외 확인
- [x] Phase 7: 디자인 시스템 개선 & 라이트 모드 고도화
  - [x] globals.css 라이트 모드 컬러 팔레트 재설계 (Soft White-Blue)
  - [x] 레이아웃 컴포넌트(Header, Sidebar) 하드코딩된 다크 클래스 제거
  - [x] 전역 glass-panel 및 프리미엄 유틸리티 클래스 정의
  - [x] 메인 대시보드 테마 대응 리팩토링 (app-mode 연동 최적화)
  - [x] 글래스모피즘(Glassmorphism) 세부 페이지 적용 및 검증
- [/] Phase 8: 최종 안정화 및 품질 검토
  - [ ] 전체 빌드 및 타입 체크 (`npm run build`)
  - [ ] 테마 전환 시 가독성 및 미적 만족도 최종 확인
  - [ ] 사용자 최종 피드백 반영
