# /init — Session Initialization Workflow

> **목적:** 새 작업 세션 시작 시 실행. 문서를 읽지 않고 코딩하는 패턴을 방지합니다.
> **사용법:** 안티그래비티 입력창에 `/init` 입력

---

## Step 1: 헌법 확인

Read the file `docs/reference/AI_RULES.md` and confirm:
- Current Prism Design System version
- TypeScript `any`/`unknown` rules
- UUID function to use
- FSD layer order

Report: "✅ 헌법 확인 완료 — AI_RULES V[version]"

## Step 2: 현재 작업 파악

Read the file `docs/handover/WORK_ORDER_ERP_PHASE4.md` and summarize:
- What Phase 4 ERP features are pending
- What is already implemented (do not touch)
- The `projects` table conflict warning if present

Report: "✅ 작업 명세 확인 완료 — 현재 남은 작업: [list]"

## Step 3: 디자인 시스템 상태 확인

Read `docs/design/prism_system.md` and check:
- Current design system version
- Which utility classes are defined (e.g. `tactile-panel`, `glass-panel`)

Then check `src/app/globals.css` to verify those classes are actually implemented.

Report any mismatch: "⚠️ 미구현 클래스: [list]" or "✅ 디자인 시스템 정합성 확인"

## Step 4: 준비 완료 보고

Output a summary:
```
=== 세션 초기화 완료 ===
헌법: AI_RULES [version]
디자인: Prism [version] ([구현 상태])
현재 작업: [WORK_ORDER 요약]
미구현 클래스: [있으면 목록, 없으면 "없음"]

준비됐습니다. 어떤 작업을 시작할까요?
```
