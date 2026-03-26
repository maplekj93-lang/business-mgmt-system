# Project Directory Structure (FSD Blueprint)

이 프로젝트는 FSD(Feature-Sliced Design) 아키텍처와 명확한 문서화 체계를 따릅니다.

## 📂 Documentation Structure (docs/)
- **[START_HERE.md](START_HERE.md):** 프로젝트 최상위 진입점.
- **reference/:** 상시 참고 자료 (AI_RULES.md, STRUCTURE.md, GLOSSARY.md).
- **design/:** 시스템 및 디자인 설계 (ARCHITECTURE.md, SYSTEM_DESIGN.md).
- **features/:** 기능별 상세 명세 및 최적화 가이드.
- **implementation/:** 구현 가이드 및 마이그레이션 체크리스트.
- **planning/:** 로드맵 및 단계별 계획 (PHASE4_PLAN.md, research/).
- **decisions/:** 아키텍처 결정 기록 (ADR).
- **handover/:** 인수인계 및 FAQ.
- **archive/:** 완료되거나 폐기된 과거 문서.

## 📂 Source Code structure (src/)
- **app/:** Next.js App Router (Routing Only).
- **widgets/:** 독립적인 대형 UI 블록 (Features + UI 조합).
- **features/:** 사용자 인터랙션 & 비즈니스 유스케이스.
- **entities/:** 비즈니스 도메인 모델 (Schema + Type).
- **shared/:** 순수 재사용 단위 (UI, API 유틸, Lib).

## 📂 Database (supabase/)
- **migrations/:** SQL 마이그레이션 파일.
- **seed.sql:** 초기 개발용 데이터.
