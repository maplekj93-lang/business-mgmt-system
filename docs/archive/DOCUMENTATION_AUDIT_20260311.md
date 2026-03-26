# 📋 문서 구조 감사 및 정리 계획 (2026-03-11)

> **현황:** 62개의 MD 파일 산재
> **문제:** 중복, 구조 혼란, 폐기 필요 파일 다수
> **권장:** 전체 재정리

---

## 📊 현재 문서 현황

```
docs/
├── decisions/ (1)
├── design/ (8)
├── features/ (6)
├── handover/ (7)  ← 2026-03-11 신규 추가
├── planning/ (19 + 11 archive)
├── reference/ (3)
├── specs/ (7)
├── troubleshooting/ (1)
├── phase3_summary.md (1)
────────────────
총 62개 파일
```

---

## 🚨 발견된 문제점

### 1. 중복된 문서 (매우 심각)

| 문서 | 위치 1 | 위치 2 | 상태 |
|------|--------|--------|------|
| Sprint2 설계 | `L_and_D_ERP_Sprint2_Design.md` | `Smart_Tagging_Optimization.md` Part 2-4 | 🔴 완전 중복 |
| Mobile UX | `Mobile_UX_Optimization.md` | `dashboard_design.md` | ⚠️ 부분 중복 |
| ERP 로드맵 | `ROADMAP.md` | `ERP_DESIGN.md` | ⚠️ 부분 중복 |
| Phase 4 | `WORK_ORDER_ERP_PHASE4.md` | `PHASE4_PLAN_V2.md` | 🔴 완전 중복 |

### 2. 폐기되어야 할 파일 (구형, 아래에서 권장)

```
docs/planning/archive/
  ├── ANTIGRAVITY_CHECKLIST.md (구버전)
  ├── CLEANUP_ZERO_TX_WALKTHROUGH.md (완료됨)
  ├── DESIGN_IMPROVEMENT_WALKTHROUGH.md (완료됨)
  ├── IMPLEMENTATION_SUMMARY.md (구버전)
  ├── OVERHAUL_PLAN.md (완료됨)
  ├── OVERHAUL_TASKS.md (완료됨)
  ├── PHASE0_3_AUDIT_REPORT.md (구버전)
  ├── TASK_1-3_PROGRESS.md (구버전, 3개)
  ├── TODO_FOR_ANTRIGRAVITY.md (구버전)
  ├── TRANSFER_CATEGORY_IMPLEMENTATION.md (완료됨)
  ├── UNCLASSIFIED_CLEANUP_GUIDE.md (완료됨)
  └── WORK_ORDER_v1_DEPRECATED.md (폐기됨)

docs/planning/ (구형, 정리 필요)
  ├── DESIGN_IMPROVEMENT_WALKTHROUGH.md (archive와 중복)
  ├── ERP_DESIGN.md (WORK_ORDER_ERP_PHASE4와 중복)
  ├── IMPLEMENTATION_GUIDE.md (COMPLETE_IMPLEMENTATION_GUIDE와 중복)
  ├── PRIORITY_1_IMPLEMENTATION.md (구버전)
  ├── Partially_Implemented_Features_Review.md (구버전)
  ├── STITCH_FRONTEND_PROMPT.md (프롬프트용, 실제 설계 아님)
  ├── dashboard_redesign_research.md (research용)
  ├── research.md (제목 모호)
  └── 5개 Gap Analysis/Missing Features (중복성 높음)
```

### 3. 혼란스러운 네이밍

| 파일명 | 문제 | 권장 |
|--------|------|------|
| `import_sync_guide.md` | 3개 버전 있음 | 1개로 통합 |
| `research.md` | 너무 일반적 | 구체적 제목으로 |
| `L_and_D_ERP_*.md` | 5개 버전 | 현재 버전만 유지 |
| `PHASE4_*.md` | 2개 버전 | 1개로 통합 |

### 4. 폴더 구조의 혼란

```
현재 (혼란):
├── planning/
│   ├── L_and_D_ERP_Feature_Research_V1.0.md  (설계?)
│   ├── L_and_D_ERP_Gap_Analysis.md  (분석?)
│   ├── L_and_D_ERP_Missing_Features_Final.md  (분석?)
│   ├── ROADMAP.md  (로드맵?)
│   └── archive/  (구형)

권장 (명확):
├── planning/
│   ├── ROADMAP.md  (전체 로드맵, 단 1개)
│   ├── QUARTERLY_PLAN.md  (분기별 계획)
│   ├── archive/  (이전 계획 내역)
│   └── research/  (조사, 분석 자료)

├── design/
│   ├── ARCHITECTURE.md  (시스템 아키텍처)
│   ├── SYSTEM_DESIGN.md  (전체 설계)
│   └── COMPONENT_PATTERNS.md  (UI 패턴)

├── features/
│   ├── SPRINT1_DESIGN.md  (현재 Sprint 1)
│   ├── SPRINT2_DESIGN.md  (현재 Sprint 2)
│   └── (기능별 최적화 가이드)

├── implementation/  ← 신규
│   ├── SPRINT1_GUIDE.md
│   ├── SPRINT2_CHECKLIST.md
│   └── IMPLEMENTATION_CHECKLIST.md

├── reference/
│   ├── AI_RULES.md
│   ├── STRUCTURE.md
│   ├── MDT_CATALOG.md
│   └── GLOSSARY.md  ← 신규 (용어집)
```

---

## ✅ 정리 계획 (단계별)

### Phase 1: 문서 분류 (문서를 3개 그룹으로 분류)

#### Group A: 핵심 문서 (유지, 정리 가능)
```
✅ 유지
  docs/reference/
    ├── AI_RULES.md (헌법)
    ├── STRUCTURE.md (폴더 구조)
    └── MDT_CATALOG.md (도메인 사전)

  docs/design/
    ├── SYSTEM_DESIGN.md (통합 시스템 설계)
    ├── ARCHITECTURE.md (아키텍처)
    ├── UI_PATTERNS.md (컴포넌트 패턴)
    └── PRISM_SYSTEM.md (디자인 토큰)

  docs/features/
    ├── SPRINT1_DESIGN.md (Sprint 1 설계)
    ├── SPRINT2_DESIGN.md (Sprint 2 설계)
    ├── MOBILE_UX_OPTIMIZATION.md (모바일 최적화)
    └── SMART_TAGGING_OPTIMIZATION.md (스마트 태깅)

  docs/implementation/  ← 신규
    ├── SPRINT1_IMPLEMENTATION_GUIDE.md
    ├── SPRINT2_IMPLEMENTATION_GUIDE.md
    ├── COMPLETE_CHECKLIST.md
    └── DB_MIGRATION_CHECKLIST.md

  docs/handover/
    ├── START_HERE.md (입구)
    ├── ANTIGRAVITY_HANDOVER.md (기술 스택)
    ├── WORK_ORDER_ERP_PHASE4.md (Phase 4 명세)
    └── QUICK_REFERENCE.md  ← 신규 (자주 참고)

  docs/planning/
    ├── ROADMAP.md (전체 로드맵)
    ├── QUARTERLY_PLAN.md (분기 계획)
    ├── archive/ (이전 계획)
    └── research/  ← 신규 폴더
```

#### Group B: 폐기 (즉시 삭제)
```
❌ 삭제 예정
  docs/planning/archive/* (모두, 과거 내용)
  docs/planning/DESIGN_IMPROVEMENT_WALKTHROUGH.md (archive 복사본)
  docs/planning/ERP_DESIGN.md (WORK_ORDER로 대체)
  docs/planning/IMPLEMENTATION_GUIDE.md (handover로 대체)
  docs/planning/PRIORITY_1_IMPLEMENTATION.md (구버전)
  docs/planning/Partially_Implemented_Features_Review.md (구버전)
  docs/planning/STITCH_FRONTEND_PROMPT.md (프롬프트용)
  docs/planning/L_and_D_ERP_Gap_Analysis.md (구버전 분석)
  docs/planning/L_and_D_ERP_Missing_Features_Final.md (구버전 분석)
```

#### Group C: 통합 필요
```
⚠️ 통합
  import_sync_guide.md × 3 → 1개 파일로 통합
  PHASE4_PLAN_V2.md + PHASE4_TASKS.md → WORK_ORDER_ERP_PHASE4.md로 통합
  기타 모바일 관련 → MOBILE_UX_OPTIMIZATION.md로 통합
```

---

### Phase 2: 폴더 재구성

**현재 구조:**
```
docs/
├── decisions/ (1)
├── design/ (8)
├── features/ (6)
├── handover/ (7)
├── planning/ (30)
├── reference/ (3)
├── specs/ (7)
├── troubleshooting/ (1)
└── phase3_summary.md (1)
```

**목표 구조:**
```
docs/
├── 📌 START_HERE.md (최상위 진입점)
│
├── reference/ (상시 참고)
│   ├── AI_RULES.md ⭐
│   ├── STRUCTURE.md ⭐
│   ├── MDT_CATALOG.md
│   ├── GLOSSARY.md (신규)
│   └── UI_PATTERNS.md
│
├── design/ (설계 문서)
│   ├── SYSTEM_DESIGN.md
│   ├── ARCHITECTURE.md
│   ├── PRISM_SYSTEM.md
│   ├── DESIGN_TOKENS.md
│   └── COMPONENT_PATTERNS.md
│
├── features/ (기능 최적화)
│   ├── SPRINT1_DESIGN.md ⭐
│   ├── SPRINT2_DESIGN.md ⭐
│   ├── MOBILE_UX_OPTIMIZATION.md
│   ├── SMART_TAGGING_OPTIMIZATION.md
│   └── (기능별 상세 가이드)
│
├── implementation/ (신규 - 구현 가이드)
│   ├── SPRINT1_GUIDE.md
│   ├── SPRINT2_GUIDE.md
│   ├── IMPLEMENTATION_CHECKLIST.md
│   ├── DB_MIGRATION_CHECKLIST.md
│   └── TROUBLESHOOTING.md
│
├── planning/ (계획)
│   ├── ROADMAP.md (전체 로드맵)
│   ├── QUARTERLY_PLAN.md (분기별)
│   ├── PHASE4_PLAN.md
│   ├── research/ (신규 - 조사/분석)
│   │   ├── market_analysis.md
│   │   ├── feature_research.md
│   │   └── technical_analysis.md
│   └── archive/ (이전 계획)
│
├── handover/ (인수인계)
│   ├── START_HERE.md
│   ├── ANTIGRAVITY_HANDOVER.md
│   ├── QUICK_REFERENCE.md
│   └── FAQ.md (신규)
│
├── decisions/ (결정 기록)
│   └── (ADR 형식)
│
└── archive/ (완료된 작업)
    └── (이전 작업 내역)
```

---

## 🎯 실행 순서

### Step 1: 신규 폴더 생성
```bash
mkdir -p docs/implementation
mkdir -p docs/planning/research
mkdir -p docs/archive
```

### Step 2: 파일 이동/통합

**이동:**
```bash
# handover 정리
mv docs/handover/START_HERE_20260311.md → docs/START_HERE.md
mv docs/handover/README_20260311.md → docs/implementation/QUICK_START.md

# planning → implementation로 이동
mv docs/handover/COMPLETE_IMPLEMENTATION_GUIDE_20260311.md → docs/implementation/SPRINT1_GUIDE.md
mv docs/handover/DB_MIGRATION_CHECKLIST_20260311.md → docs/implementation/DB_MIGRATION_CHECKLIST.md

# planning/research 생성
mv docs/planning/L_and_D_ERP_Feature_Research_V1.0.md → docs/planning/research/
mv docs/planning/dashboard_redesign_research.md → docs/planning/research/
```

**통합:**
```bash
# import_sync_guide × 3 → 1개
combine:
  - docs/features/import_sync_guide.md
  - docs/features/WORK_ORDER_import_sync_guide.md
  - docs/features/import_sync_guide_technical_specification.md
→ docs/features/IMPORT_SYNC_GUIDE.md (단일)

# PHASE4
combine:
  - docs/planning/PHASE4_PLAN_V2.md
  - docs/planning/PHASE4_TASKS.md
→ docs/planning/PHASE4_PLAN.md (단일)
```

**삭제:**
```bash
# archive는 그대로 두고
# 하지만 planning/ 내 구버전 삭제
rm docs/planning/ERP_DESIGN.md
rm docs/planning/IMPLEMENTATION_GUIDE.md
rm docs/planning/PRIORITY_1_IMPLEMENTATION.md
rm docs/planning/Partially_Implemented_Features_Review.md
rm docs/planning/DESIGN_IMPROVEMENT_WALKTHROUGH.md
rm docs/planning/STITCH_FRONTEND_PROMPT.md
rm docs/planning/L_and_D_ERP_Gap_Analysis.md
rm docs/planning/L_and_D_ERP_Missing_Features_Final.md
```

### Step 3: 문서 추가/정의

**신규 생성:**
```
docs/reference/GLOSSARY.md (용어집)
docs/handover/QUICK_REFERENCE.md (자주 참고하는 링크)
docs/handover/FAQ.md (자주 묻는 질문)
docs/planning/QUARTERLY_PLAN.md (분기별 계획)
docs/implementation/TROUBLESHOOTING.md (문제 해결)
```

### Step 4: 최상위 START_HERE.md 정의

```markdown
# 👈 여기서 시작하세요

## 🎯 당신의 역할은?

### 💻 설계자 (나)
→ [docs/design/](design/)와 [docs/features/](features/) 참고

### 🛠️ 구현자 (안티그래비티)
→ [docs/START_HERE.md](START_HERE.md) → [docs/implementation/](implementation/) 순차 진행

### 📊 프로젝트 관리자
→ [docs/planning/ROADMAP.md](planning/ROADMAP.md)

---

## 📚 빠른 참고

### 설계 문서 (현재)
- [Sprint 1 설계](docs/features/SPRINT1_DESIGN.md)
- [Sprint 2 설계](docs/features/SPRINT2_DESIGN.md)
- [Mobile UX 설계](docs/features/MOBILE_UX_OPTIMIZATION.md)

### 구현 가이드 (진행 중)
- [Sprint 1 구현 가이드](docs/implementation/SPRINT1_GUIDE.md)
- [Sprint 2 체크리스트](docs/implementation/SPRINT2_CHECKLIST.md)
- [DB 마이그레이션](docs/implementation/DB_MIGRATION_CHECKLIST.md)

### 참고 자료
- [AI 규칙 (절대 헌법)](docs/reference/AI_RULES.md)
- [폴더 구조](docs/reference/STRUCTURE.md)
- [용어집](docs/reference/GLOSSARY.md)
- [자주 묻는 질문](docs/handover/FAQ.md)

---

자세한 내용은 각 폴더를 탐색하세요.
```

---

## 📊 정리 후 예상 결과

```
현재: 62개 파일 (혼란)
정리 후: 35개 파일 (명확)

제거: 20개 (구버전, 중복)
통합: 7개 → 3개 (3개 절약)
신규: 5개 (명확성 향상)

구조: 혼란 → 명확
     분류: 7개 폴더 → 10개 폴더 (명확한 목적)
     네이밍: 일관성 없음 → 일관성 있음
```

---

## 🎁 이 정리의 효과

### 설계자 입장
- ✅ 설계 문서 한곳에 (features/)
- ✅ 참고 자료 한곳에 (reference/)
- ✅ 구형 파일 안 봐도 됨

### 구현자 (안티그래비티) 입장
- ✅ 진입점 명확 (START_HERE.md)
- ✅ 구현 순서 명확 (implementation/)
- ✅ 체크리스트 통합 (IMPLEMENTATION_CHECKLIST.md)
- ✅ 혼란스러운 파일 제거

### 프로젝트 전체
- ✅ 문서 네이게이션 쉬움
- ✅ 새로운 팀원 온보딩 빠름
- ✅ 중복 최소화
- ✅ 유지보수 용이

---

## ❓ 시작하기 전 확인

**이 정리를 진행하겠습니까?**

1. ✅ **지금 바로 정리** (1-2시간 소요)
   - 폴더 재구성 + 파일 이동 + 통합 + 삭제

2. 📋 **계획만 확인** (다음에)
   - 이 문서를 참고해서 나중에 천천히

3. ⚙️ **부분 정리** (선택적)
   - 가장 중요한 부분부터 (handover/, implementation/)

---

## 제안

**권장: 지금 바로 정리 (Option 1)**

이유:
- 62 → 35개 파일로 줄어들 수 있음
- 안티그래비티 입장에서 진입점이 명확해짐
- 나중에 점점 더 복잡해질 것 같음
- 지금이 마지막 기회

---

**결정:** 어떻게 할까요? 💬
