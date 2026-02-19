# Antigravity Project Constitution (V6)

이 파일은 프로젝트의 '절대 헌법'입니다. 모든 코드는 이 규칙을 준수해야 합니다.

## 1. Project Identity
- **Goal:** 'Total Net Worth' 시각화 및 지속 가능한 비즈니스 성장 지원.
- **Twin-Track Philosophy:** 
  1. **Personal Joy (Ledger):** 낼나(Nelna) 스타일의 감성적 자산 추적 (Lunch Money 유연성).
  2. **Professional Clarity (ERP):** 엔지니어링 기반의 엄격한 비즈니스 관리 (Quote-to-Cash).

## 2. Architecture Laws (Strict FSD)
우리는 **Feature-Sliced Design (FSD)**을 엄격히 준수합니다.
- **Layers:** `src/shared` → `src/entities` → `src/features` → `src/widgets` → `src/app` (Bottom-up).
- **Unidirectional Flow:** 하위 레이어는 상위 레이어를 절대 참조할 수 없습니다 (예: `shared`가 `features`를 import 금지).
- **Public API:** 모든 슬라이스는 `index.ts`를 통해서만 외부와 통신합니다. 내부 파일 직접 참조(Deep Import) 금지.

## 3. Database & Data Integrity
- **Database-First:** 기능 구현 전, 반드시 Supabase 스키마를 먼저 확정하고 `npx supabase gen types`로 타입을 생성한 뒤 코딩합니다.
- **RLS Sovereignty:** 보안은 App 레벨이 아닌 DB 레벨의 RLS(Row Level Security)로 강제합니다.
- **Metadata Sovereignty:** 비즈니스 로직(세율, 카테고리 등)은 코드에 하드코딩하지 않고 `mdt_*` 테이블을 참조합니다.
- **Atomic Mutations:** 모든 데이터 변경은 Server Action 내에서 트랜잭션으로 처리합니다.

## 4. UI/UX Guidelines (Prism System V2.0)
- **Token Usage:** 색상 하드코딩 금지 (`bg-white` ❌). 반드시 시맨틱 토큰 사용 (`bg-background` ✅).
- **Glassmorphism:** 모든 컨테이너는 `.glass-panel` 클래스(투명도+블러)를 기본으로 사용합니다.
- **Library First:** 새로운 UI 생성 시 `src/shared/ui`의 Shadcn 컴포넌트를 우선 사용합니다.

## 5. Coding Standards
- **No `any`:** TypeScript의 엄격한 타입을 유지합니다. Zod 스키마 추론(`z.infer`)을 적극 활용합니다.
- **Error Handling:** `try/catch` 대신 `{ success, data, error }` 패턴의 결과 객체를 반환합니다.
