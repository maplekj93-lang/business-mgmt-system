# 작업 명세서: Tactile UI (Prism V3.0) 마이그레이션

> **작성일:** 2026-03-11
> **목적:** 기존 Glassmorphism (V2.1) → Tactile UI / Claymorphism (V3.0)으로 전면 교체
> **선행 조건:** `docs/design/prism_system.md` V3.0 확정 완료 ✅
> **수신:** Antigravity

---

## 현재 상태 (As-Is)

| 항목 | 현재 값 |
|------|---------|
| 디자인 시스템 | Prism V2.1 (Glassmorphism) |
| 배경색 | `hsl(220 50% 98.5%)` (Cool Blue-White) |
| 주요 유틸 클래스 | `glass-panel`, `glass-card` |
| 컨테이너 border-radius | `rounded-3xl` (1.875rem) |
| 그림자 방식 | `backdrop-blur` + `border-white/10` |

## 목표 상태 (To-Be)

| 항목 | 목표 값 |
|------|---------|
| 디자인 시스템 | Prism V3.0 (Tactile UI / Claymorphism) |
| 배경색 | `hsl(35 30% 98%)` (Warm Off-White) |
| 주요 유틸 클래스 | `tactile-panel`, `tactile-card`, `tactile-button` |
| 컨테이너 border-radius | `rounded-[2rem]` ~ `rounded-[2.5rem]` |
| 그림자 방식 | `--tactile-shadow-sm/md` + `--tactile-inner` (Neumorphism) |

---

## Step 1: `globals.css` 기반 토큰 교체

**파일:** `src/app/globals.css`

### 1-A. 배경색 CSS 변수 교체

```css
/* 변경 전 */
:root {
  --background: 220 50% 98.5%;
}
.dark {
  --background: 222 47% 11%;
}

/* 변경 후 */
:root {
  --background: 35 30% 98%;   /* Warm Off-White */
}
.dark {
  --background: 222 25% 10%;  /* Soft Deep Slate */
}
```

### 1-B. 기존 glass 유틸리티 클래스 제거 후 tactile로 교체

`prism_system.md` §3 CSS Utilities 내용 그대로 `@layer components`에 추가:

```css
/* 제거 */
.glass-panel { ... }
.glass-card { ... }

/* 추가 — prism_system.md §3 참고 */
:root {
  --tactile-shadow-sm: 8px 8px 16px #eadecf, -8px -8px 16px #ffffff;
  --tactile-shadow-md: 12px 12px 24px #eadecf, -12px -12px 24px #ffffff;
  --tactile-inner: inset 6px 6px 12px #eadecf, inset -6px -6px 12px #ffffff;
  --tactile-glow: 0 0 15px rgba(99, 102, 241, 0.4), inset 2px 2px 4px rgba(255, 255, 255, 0.3);
}
.dark {
  --tactile-shadow-sm: 8px 8px 16px #0c0d11, -8px -8px 16px #1a1d23;
  --tactile-shadow-md: 12px 12px 24px #0c0d11, -12px -12px 24px #1a1d23;
  --tactile-inner: inset 4px 4px 8px #0c0d11, inset -4px -4px 8px #1a1d23;
  --tactile-glow: 0 0 15px rgba(99, 102, 241, 0.3), inset 2px 2px 4px rgba(255, 255, 255, 0.1);
}

@layer components {
  .tactile-panel { ... }
  .tactile-card { ... }
  .tactile-button { ... }
}
```

> ⚠️ `glass-panel`, `glass-card`를 **즉시 제거하지 말 것**.
> Step 2 컴포넌트 교체 완료 후 마지막에 제거. 그 전까지는 두 클래스 공존.

---

## Step 2: 컴포넌트 클래스명 일괄 교체

`glass-panel` → `tactile-panel`, `glass-card` → `tactile-card` 교체가 필요한 파일 목록.

교체 전 반드시 `grep_search`로 실제 사용처 확인 후 진행.

```bash
# 사용처 확인 명령
grep -rn "glass-panel\|glass-card" src/ --include="*.tsx"
```

**예상 영향 파일 (확인 필요):**
- `src/widgets/income-kanban/ui/IncomeKanban.tsx`
- `src/widgets/dashboard/ui/*.tsx`
- `src/widgets/business-dashboard/ui/*.tsx`
- `src/widgets/cashflow-calendar/ui/*.tsx`
- `src/app/(dashboard)/layout.tsx`

**교체 규칙:**
| 기존 | 교체 후 |
|------|---------|
| `glass-panel` | `tactile-panel` |
| `glass-card` | `tactile-card` |
| `rounded-3xl` (컨테이너) | `rounded-[2rem]` |
| `backdrop-blur-xl` | 제거 (tactile은 blur 미사용) |
| `border border-white/10` | 제거 (tactile은 border 미사용) |
| `bg-slate-900/40` | 제거 → `bg-background` |

---

## Step 3: 버튼 스타일 교체

**영향 범위:** `src/shared/ui/button.tsx` + 인라인 버튼 스타일

- 모든 버튼 → `rounded-full` (Pill 형태) 확인
- Primary 버튼 → `tactile-button` 또는 `tactile-glow` 적용
- hover/active 인터랙션 → `scale-105` / `scale-95` + `tactile-inner`

---

## Step 4: 하드코딩 색상 정리

`ui_patterns.md` 검토 시 발견된 잔존 하드코딩 목록:

| 파일 | 문제 코드 | 교체 |
|------|-----------|------|
| `ui_patterns.md` 예시 코드 | `bg-white` | `bg-background` |
| `IncomeKanban.tsx` | `bg-slate-900/40` | `bg-background` |
| `IncomeKanban.tsx` | `border-white/10` | 제거 |
| `LogDailyRateModal.tsx` | `text-gray-500`, `bg-gray-50` | `text-muted-foreground`, `bg-muted` |
| `LogDailyRateModal.tsx` | `text-blue-600` | `text-primary` |
| `DailyLogPage` (WORK_ORDER 예시) | `bg-blue-600` | `bg-primary` |

> 교체 전 `grep_search`로 전체 파일 스캔 후 누락 없이 처리.

---

## Step 5: `ui_patterns.md` 경고 제거

마이그레이션 완료 후 `docs/design/ui_patterns.md` 상단의 경고 블록 제거:

```markdown
<!-- 제거 대상 -->
> ⚠️ **구현 상태 주의:**
> `tactile-panel`, `tactile-card` 등의 유틸리티 클래스는 **아직 `globals.css`에 미구현**입니다.
> 현재 `globals.css`에 구현된 클래스: `glass-panel`, `glass-card` (Prism V2.1)
```

그리고 참조 링크도 수정:
```markdown
<!-- 수정 -->
- 코딩 규칙(색상 강제) → `.agents/rules/coding-standards.md`
```
(`.agent/rules/02_coding_standards.md` → `.agents/rules/coding-standards.md`)

---

## ✅ 완료 체크리스트

**Step 1 — globals.css:**
- [x] `--background` CSS 변수 Warm Off-White로 교체
- [x] `--tactile-shadow-sm/md/inner/glow` 변수 추가 (라이트/다크)
- [x] `.tactile-panel`, `.tactile-card`, `.tactile-button` 클래스 추가
- [x] `glass-panel`, `glass-card` 는 Step 2 완료 전까지 유지

**Step 2 — 컴포넌트:**
- [x] `grep_search`로 `glass-panel`, `glass-card` 전체 사용처 확인
- [x] 영향 파일 전부 `tactile-panel`, `tactile-card`로 교체
- [x] `backdrop-blur`, `border-white/10` 제거
- [x] `glass-panel`, `glass-card` 클래스 globals.css에서 최종 제거

**Step 3 — 버튼:**
- [x] `button.tsx` Pill 형태 확인/적용
- [x] Primary 버튼 tactile 인터랙션 적용

**Step 4 — 하드코딩 정리:**
- [x] 전체 `src/` 스캔 후 하드코딩 색상 시맨틱 토큰으로 교체

**Step 5 — 문서 정리:**
- [x] `ui_patterns.md` 경고 블록 제거
- [x] `ui_patterns.md` `.agent/rules/` 참조 → `.agents/rules/` 수정

**검증:**
- [x] `npm run build` 에러 없음
- [x] 라이트모드 / 다크모드 양쪽 시각적 확인
- [x] 기존 가계부 `/` 대시보드 레이아웃 정상 렌더링
- [x] `/business/*` 페이지 tactile 스타일 적용 확인

---

## 구현 순서 요약

```
① Step 1-A: --background 교체
② Step 1-B: tactile CSS 변수 + 유틸 클래스 추가
③ Step 2: glass-* → tactile-* 컴포넌트 교체
④ Step 2 완료 후: glass-* 클래스 제거
⑤ Step 3: 버튼 스타일
⑥ Step 4: 하드코딩 전체 정리
⑦ Step 5: 문서 정리
⑧ npm run build 검증
```
