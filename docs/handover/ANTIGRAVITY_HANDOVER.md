# 🚀 Antigravity Project Handover (Business Mgmt System)

이 문서는 앞으로의 Antigravity(AI) 페어 프로그래밍을 위한 프로젝트 컨텍스트 및 기술 명세서입니다. 새로운 작업을 시작할 때 이 문서를 기준으로 구조를 파악하고 코드를 구현해야 합니다.

---

## 🛠 1. 기술 명세서 (Tech Stack)

### Core Framework & Library
- **Framework:** Next.js 16.1.6 (App Router 기반)
- **UI & DOM:** React 19.2.3, React DOM 19.2.3
- **Language:** TypeScript 5.x (엄격한 타입 시스템, `any` 사용 금지)

### Styling & UI
- **CSS Framework:** Tailwind CSS v4 (PostCSS 활용)
- **Design System:** Shadcn UI (Radix UI primitives - Checkbox, Dialog, Label, Popover, Select, Switch 등)
- **Iconography:** Lucide-React
- **Animation & Utils:** tailwindcss-animate, tailwind-merge, clsx, cmdk
- **Theme:** next-themes (다크 모드 지원 기본 장착)

### Database & Backend
- **BaaS:** Supabase
- **Client Library:** `@supabase/supabase-js` (v2.94.1), `@supabase/ssr` (v0.8.0)
- **Database Driver:** `pg` (PostgreSQL)

### Validation & Utilities
- **Validation:** Zod (Type Inference, Schema Validation)
- **Data Handling:** xlsx (엑셀 임포트/익스포트)
- **Chart:** Recharts
- **Toast / 알림:** Sonner

---

## 🏛 2. 아키텍처 및 폴더 구조 (FSD Architecture)

**Feature-Sliced Design (FSD)** 원칙을 엄격하게 준수합니다. 하위 레이어는 상위 레이어를 참조할 수 없는 단방향 의존성을 가집니다.

```text
/src
 ├── app/       # [최상위] 라우팅 전용 (layout.tsx, page.tsx, providers.tsx 등)
 ├── widgets/   # [조합] 독립적인 대형 UI 블록 (sidebar, stats-card, dashboard 등)
 ├── features/  # [로직] 사용자 인터랙션 & 주요 유스케이스 구현부
 ├── entities/  # [도메인] 비즈니스 도메인 모델 (Schema + DB Types)
 └── shared/    # [최하위] UI 컴포넌트, 공통 API, 유틸 함수 등 순수 재사용 단위
```

---

## 📦 3. 주요 도메인 개체 (Entities)

현재 정의된 주요 비즈니스 도메인 폴더(`src/entities/`)는 다음과 같습니다:

1. **`transaction`**: 핵심 거래 내역 모델, 분류 및 Zod 스키마
2. **`category`**: 수입/지출 카테고리 (계층 구조 지원)
3. **`asset`**: 자산 및 계좌 정보
4. **`analytics`**: 통계 및 분석 관련 모델
5. **`business`**: 비즈니스 / 파트너 관련 모델
6. **`project`**: 수행 중인 프로젝트 단위 모델
7. **`item`**: 조명/자재 등 취급 아이템 모델

---

## 🧩 4. 구현된 주요 기능 (Features & Widgets)

### Features (`src/features/`)
- **`ledger-import`**: 엑셀 가계부 파일 파싱 및 데이터 검증 로직
- **`allocate-transaction`**: 거래 내역 카테고리/자산 할당
- **`filter-transactions`**: 거래 내역 필터링
- **`manage-categories`**: MDT 카테고리 데이터 관리
- **`refine-ledger`**: 장부 정제 및 정리 로직
- **`switch-mode`**: 비즈니스 로직 및 모드 전환 처리
- **`analytics`**: 트랜잭션 등 데이터 시각화 준비 로직
- **`auth`**: 사용자 인증 로직
- **`create-quote`**: 견적서 생성 유스케이스

### Widgets (`src/widgets/`)
- **`transaction-history`**: 거래 내역 테이블/목록 (최근 "Nellna 가계부" 스타일 업데이트 완료)
- **`dashboard`**: 메인 대시보드 요약 화면 컴포넌트 조합
- **`stats-card`**: 통계 수치(Total Net Worth, Monthly, etc.) 위젯
- **`sidebar`**: 전역 네비게이션을 담당하는 레이아웃 위젯

---

## 📜 5. 절대 규칙 (Antigravity Project Constitution)

> ⚠️ 이 섹션은 요약본입니다. 실제 규칙은 **`docs/reference/AI_RULES.md` (V7)** 이 최우선입니다.
> 이 문서와 AI_RULES.md가 충돌할 경우 **항상 AI_RULES.md를 따르세요.**

1. **Twin-Track Philosophy:**
    - Personal Joy (Ledger): '낼나' 스타일의 감성적 자산 추적
    - Professional Clarity (ERP): 엄격한 비즈니스 관리 (Quote-to-Cash 지원)
2. **Database-First:**
    - UI/기능 개발 전에 Supabase 스키마를 설계하고 `npx supabase gen types`로 타입을 추출한 후 작업합니다.
    - 권한 제어는 DB 레벨의 RLS로 수행하며 구조적 메타데이터는 `mdt_*` 테이블을 참조합니다 (`mdt_category` 등).
3. **UI/UX Guidelines (Prism System V2.1):** ← V2.1 확정 (V2.0 아님)
    - **색상 하드코딩 금지!** (ex: `bg-white` ❌ / `bg-background` ✅)
    - 투명도/블러 패널(`glass-panel`) 클래스를 활용한 Glassmorphism 도입.
    - 새로운 컴포넌트는 `src/shared/ui`의 Shadcn 기반 컴포넌트를 사용해 구성합니다.
4. **Strict TypeScript & Safety:**
    - `any` 타입 및 `as any` 캐스트 금지. `unknown` 타입은 타입가드와 함께 사용 시 허용.
    - 에러 처리는 Throw 대신 `{ success, data, error }` 구조를 통일하여 반환합니다.
