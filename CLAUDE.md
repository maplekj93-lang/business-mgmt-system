# 🤖 Antigravity — AI 작업 진입점

> 이 파일은 Antigravity(AI 페어 프로그래머)를 위한 **유일한 시작점**입니다.
> 새 작업 세션 시작 시 반드시 이 파일부터 읽고, 아래 순서대로 선독하세요.

---

## ⚡ 초기화 규칙 (Initialization Protocol) — 생략 불가

작업 지시를 받았을 때, **즉시 코드나 파일을 생성하지 마세요.**
반드시 아래 순서를 따릅니다:

1. 이 파일(CLAUDE.md) 읽기 — 현재 완료
2. `docs/reference/AI_RULES.md` 읽기 — 헌법 확인
3. `docs/handover/WORK_ORDER_ERP_PHASE4.md` 읽기 — 현재 작업 파악
4. **요구사항이 모호하면 즉시 질문** — 추측으로 공백을 채우지 말 것
5. 새 기능 구현 시 → `docs/specs/`에 명세서 먼저 작성 후 코드 작업

> 📌 **"질문 먼저, 코드는 나중"** — 모호함이 있으면 반드시 clarify 후 진행

---

## 📋 필수 선독 순서

| 순서 | 파일 | 목적 |
|------|------|------|
| 1 | `docs/reference/AI_RULES.md` | **절대 헌법 V7** — 모든 규칙의 최우선 기준 |
| 2 | `docs/reference/STRUCTURE.md` | FSD 폴더 구조 |
| 3 | `docs/reference/MDT_CATALOG.md` | 비즈니스 도메인 사전 |
| 4 | `docs/handover/ANTIGRAVITY_HANDOVER.md` | 기술 스택 (AI_RULES와 충돌 시 **AI_RULES 우선**) |

---

## 🔨 현재 진행 중인 작업

**Phase 4: ERP 기능 구현**

→ **작업 명세서:** `docs/handover/WORK_ORDER_ERP_PHASE4.md`

---

## 🚦 우선순위 충돌 해결 규칙 (Conflict Resolution)

문서들이 서로 다른 지시를 할 경우, 아래 순서로 판단합니다:

```
[1순위] AI_RULES.md 헌법 (절대 우선)
[2순위] CLAUDE.md 이 파일 (초기화 및 운영 규칙)
[3순위] WORK_ORDER_ERP_PHASE4.md (현재 작업 명세)
[4순위] ANTIGRAVITY_HANDOVER.md (기술 스택 참고)
[5순위] docs/planning/ 문서들 (계획 참고용)
```

**충돌이 발생하면 상위 순위 문서를 따르고, 반드시 사용자에게 알릴 것.**

---

## 🚫 불가역 행위 제한 (Irreversible Action Gate)

아래 행위는 **사용자의 명시적 확인 없이 절대 실행 금지:**

- DB 테이블 `DROP` 또는 `TRUNCATE`
- `DELETE` 쿼리 (WHERE 조건 없는 전체 삭제)
- 파일 영구 삭제
- `supabase gen types` 외의 DB 스키마 직접 수정
- 프로덕션 환경 배포 (`vercel --prod` 등)

> 위 행위가 필요한 경우: 실행 전 사용자에게 내용을 설명하고 확인을 받은 뒤 진행

---

## 🚨 알려진 불일치 사항

1. **`ANTIGRAVITY_HANDOVER.md`의 Prism System 버전** → V2.0 표기지만 실제 적용은 **V2.1** (`AI_RULES.md` 기준)
2. **`any` 타입** → `as any` 캐스트 금지. `unknown` + 타입가드는 허용
3. **UUID 함수** → `gen_random_uuid()` 사용. (`uuid_generate_v4()` 금지)

---

## 📁 문서 구조

```
docs/
├── reference/          # 상시 참조 — 헌법, 구조, 도메인 사전
│   ├── AI_RULES.md     ← 절대 헌법 (최우선)
│   ├── STRUCTURE.md    ← FSD 폴더 가이드
│   └── MDT_CATALOG.md  ← 비즈니스 로직 상수 사전
│
├── handover/           # 작업 인수인계 문서
│   ├── ANTIGRAVITY_HANDOVER.md         ← 기술 스택
│   └── WORK_ORDER_ERP_PHASE4.md        ← 현재 작업 명세서 ✅
│
├── specs/              # ★ 기능 구현 전 명세서 출력 위치
│   └── (기능명).md     ← 새 기능마다 여기에 먼저 작성
│
├── planning/           # 계획 문서 (현재 진행)
│   └── archive/        ← 완료된 Phase (참고용)
│
└── design/             # UI/UX 설계 문서
│   ├── prism_system.md     ← 토큰 시스템 (3계층)
│   ├── dashboard_design.md ← 대시보드 레이아웃 설계
│   ├── architecture_overhaul.md ← 네비게이션/라우팅 계획
│   └── ui_patterns.md      ← ★ 컴포넌트 레벨 패턴 가이드 (V1.0)
```

---

## 💡 작업 원칙 요약

- **Database-First:** Supabase 스키마 확정 → `npx supabase gen types` → 코딩
- **Spec-First:** 새 기능은 `docs/specs/기능명.md` 작성 후 구현 시작
- **FSD 엄수:** `shared` → `entities` → `features` → `widgets` → `app` 단방향 의존성
- **토큰 사용:** 시맨틱 토큰만 (`bg-background`, `text-foreground` 등, 하드코딩 금지)
- **에러 처리:** `throw` 대신 `{ success, data, error }` 패턴 반환
- **질문 우선:** 모호한 요구사항은 추측하지 말고 즉시 질문
