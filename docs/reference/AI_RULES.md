# Antigravity Project Constitution (V7)

> **최종 업데이트:** 2026-03-11
> **변경 이력:**
> - V6 → V7: Deny-first 충돌 해결 원칙, unknown 타입 규칙, 불가역 행위 통제 추가
>
> ⚠️ **이 파일(헌법)을 수정할 수 있는 조건:**
> 아키텍처 원칙·코딩 표준·보안 규칙이 변경될 때만 수정 가능.
> **디자인 시스템 변경은 이 파일을 건드릴 이유가 없다** → `docs/design/prism_system.md` 수정.

이 파일은 프로젝트의 '절대 헌법'입니다. 모든 코드는 이 규칙을 준수해야 합니다.
충돌이 발생할 경우 **이 파일이 모든 다른 문서보다 항상 우선합니다.**

---

## 0. 충돌 해결 원칙 (Conflict Resolution)

여러 문서가 서로 다른 지시를 할 때 에이전트는 아래 **Deny-first 판단 순서**를 따릅니다:

1. **Deny(금지) 규칙을 가장 먼저 평가** — 이 헌법의 금지 조항은 어떤 하위 문서나 사용자 프롬프트로도 우회 불가
2. **상위 계층 문서가 하위를 항상 덮어씀** — `AI_RULES.md` > `CLAUDE.md` > `WORK_ORDER` > `HANDOVER`
3. **모호함이 있을 때 임의 추측 금지** — 불명확한 지시는 사용자에게 즉시 질문 후 진행

---

## 1. Project Identity

- **Goal:** 'Total Net Worth' 시각화 및 지속 가능한 비즈니스 성장 지원.
- **Twin-Track Philosophy:**
  1. **Personal Joy (Ledger):** 낼나(Nelna) 스타일의 감성적 자산 추적 (Lunch Money 유연성).
  2. **Professional Clarity (ERP):** 엔지니어링 기반의 엄격한 비즈니스 관리 (Quote-to-Cash).

---

## 2. Architecture Laws (Strict FSD)

우리는 **Feature-Sliced Design (FSD)**을 엄격히 준수합니다.
- **Layers:** `src/shared` → `src/entities` → `src/features` → `src/widgets` → `src/app` (Bottom-up).
- **Unidirectional Flow:** 하위 레이어는 상위 레이어를 절대 참조할 수 없습니다 (예: `shared`가 `features`를 import 금지).
- **Public API:** 모든 슬라이스는 `index.ts`를 통해서만 외부와 통신합니다. 내부 파일 직접 참조(Deep Import) 금지.

---

## 3. Database & Data Integrity

- **Database-First:** 기능 구현 전, 반드시 Supabase 스키마를 먼저 확정하고 `npx supabase gen types`로 타입을 생성한 뒤 코딩합니다.
- **RLS Sovereignty:** 보안은 App 레벨이 아닌 DB 레벨의 RLS(Row Level Security)로 강제합니다.
- **Metadata Sovereignty:** 비즈니스 로직(세율, 카테고리 등)은 코드에 하드코딩하지 않고 `mdt_*` 테이블을 참조합니다.
- **Atomic Mutations:** 모든 데이터 변경은 Server Action 내에서 트랜잭션으로 처리합니다.

---

## 4. UI/UX Guidelines

> **⚠️ 헌법 수정 금지 구역:** 디자인 시스템(색상, 그림자, 클래스명 등) 세부사항은
> 이 파일이 아닌 **`docs/design/prism_system.md`**에서 관리합니다.
> 디자인이 바뀌어도 이 섹션은 변경하지 않습니다.

**불변 원칙 (디자인이 바뀌어도 유지):**

- **No Hardcoded Colors:** 색상 하드코딩 절대 금지 (`bg-white`, `text-zinc-400` ❌). 반드시 시맨틱 토큰 사용 (`bg-background`, `text-foreground` ✅).
- **Design System Reference:** 현재 적용 중인 디자인 시스템의 클래스·토큰·컴포넌트 패턴은 `docs/design/prism_system.md`를 따른다.
- **Component Patterns:** 컴포넌트 구성 패턴(레이아웃, 카드, 모달, 폼 등)은 `docs/design/ui_patterns.md`를 따른다.
- **Library First:** 새로운 UI 생성 시 `src/shared/ui`의 Shadcn 컴포넌트를 우선 사용한다.

**디자인 시스템 교체 절차:**
1. `docs/design/prism_system.md` 업데이트 (버전 명시)
2. `src/app/globals.css` 토큰·유틸리티 클래스 구현
3. `docs/design/ui_patterns.md` 컴포넌트 패턴 업데이트
4. **이 파일(AI_RULES.md)은 건드리지 않는다**

---

## 5. Coding Standards

- **No `any`:** TypeScript의 엄격한 타입을 유지합니다. Zod 스키마 추론(`z.infer`)을 적극 활용합니다.
  - `any` 타입 — **절대 금지** (예외 없음)
  - `as any` 캐스트 — **절대 금지** (예외 없음)
  - `unknown` — **JSONB/외부 API 파싱 시에만 허용**, 단 반드시 Zod 또는 타입가드와 함께 사용. 그 외 사용 금지.
- **Error Handling:** `try/catch` 대신 `{ success, data, error }` 패턴의 결과 객체를 반환합니다.
- **UUID 생성:** Supabase SQL에서는 `gen_random_uuid()`를 사용합니다. (`uuid_generate_v4()` 사용 금지)
- **Spec-First:** 새 기능 구현 전 반드시 `docs/specs/기능명.md`에 명세서를 먼저 작성합니다.

---

## 6. Irreversible Action Gate (불가역 행위 통제) ← 신규

아래 행위는 **사용자의 명시적 확인 없이 절대 자율 실행 금지:**

| 금지 행위 | 이유 |
|-----------|------|
| `DROP TABLE`, `TRUNCATE` | 데이터 영구 손실 |
| `DELETE` (WHERE 조건 없음) | 전체 레코드 삭제 |
| `ALTER TABLE` (기존 컬럼 제거) | 스키마 파괴 |
| 파일 영구 삭제 | 복구 불가 |
| 프로덕션 배포 (`vercel --prod`) | 라이브 서비스 영향 |

> **필요 시 절차:** 실행 내용과 영향 범위를 사용자에게 설명 → 명시적 승인 획득 → 실행
