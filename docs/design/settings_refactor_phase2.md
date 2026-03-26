# Design: Phase 2 설정 탭 재편 (Classification 통합)

## 1. 컴포넌트 구조 설계

### A. `TaggingRuleManager` (`src/features/refine-ledger/ui/tagging-rule-manager.tsx`)
- 기존 `tagging-rules/page.tsx`의 클라이언트 로직을 이동.
- Props: 없음 (내부에서 Supabase 클라이언트로 데이터 페칭 유지)
- 기능: 규칙 조회, 추가, 삭제, 검색.

### B. `CategoryManager` (`src/features/manage-categories/ui/category-manager.tsx`)
- 기존 `categories/page.tsx`의 렌더링 로직을 이동.
- Props: 
    - `initialTree`: `CategoryTree[]` (서버에서 페칭한 초기 데이터)
- 기능: 카테고리 트리 렌더링, 대분류 추가 다이얼로그 연동.

### C. `ClassificationPage` (`src/app/(dashboard)/settings/classification/page.tsx`)
- 서버 컴포넌트.
- `getCategoryTree()`를 호출하여 데이터를 가져옴.
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`를 사용하여 레이아웃 구성.

## 2. URL 및 리다이렉트 설계

### A. 내비게이션 수정 (`src/app/(dashboard)/settings/layout.tsx`)
- `SETTINGS_NAV` 수정:
    - `/settings/categories` -> 제거
    - `/settings/tagging-rules` -> 제거
    - `path: '/settings/classification'`, `label: '분류 설정'` -> 추가

### B. 리다이렉트 구현
- `/settings/categories/page.tsx`에서 `redirect('/settings/classification')` 호출.
- `/settings/tagging-rules/page.tsx`에서 `redirect('/settings/classification')` 호출.

## 3. UI/UX 개선사항
- 탭 전환 시 부드러운 애니메이션 적용 (`animate-in` 등 기존 클래스 유지).
- 두 기능 모두 "분류"라는 큰 맥락 아래 있으므로, 상단 타이틀은 하나로 통일하고 하위 설명만 탭별로 다르게 제공 가능.
