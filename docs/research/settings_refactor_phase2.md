# Research: Phase 2 설정 탭 재편 (Classification 통합)

## 1. 현재 구현 현황 분석

### A. 카테고리 관리 (`/settings/categories/page.tsx`)
- **형태**: 서버 컴포넌트 (`async function`)
- **주요 기능**:
    - `getCategoryTree()`를 통해 카테고리 트리를 서버사이드에서 조회.
    - `CategoryListItem`을 사용하여 재귀적으로 트리 렌더링.
    - `CategoryFormDialog`를 통해 대분류 추가 기능 제공.
- **스타일**: `tactile-panel`, `animate-in` 등 맞춤형 CSS 클래스 사용.

### B. 스마트 태깅 규칙 (`/settings/tagging-rules/page.tsx`)
- **형태**: 클라이언트 컴포넌트 (`'use client'`)
- **주요 기능**:
    - Supabase 클라이언트를 사용하여 `mdt_allocation_rules` 및 `mdt_categories` 조회.
    - 규칙 추가, 삭제, 검색 기능 포함.
    - 매칭 방식(정확히 일치/포함) 및 사업비 여부 설정 가능.
- **스타일**: `shared/ui`의 `Card`, `Table`, `Badge` 등 Lucide-React 아이콘과 함께 사용.

## 2. 통합 방향 및 설계 고려사항

- **Tabs UI 사용**: `shared/ui/tabs.tsx`를 사용하여 "카테고리"와 "태깅 규칙"을 탭으로 분리.
- **컴포넌트 추출**:
    - `TaggingRulesPage`의 로직을 `TaggingRuleManager` 컴포넌트로 추출하여 재사용성 확보.
    - `CategoryManagementPage`의 로직을 `CategoryManager` 컴포넌트로 추출.
- **데이터 페칭**:
    - 카테고리 트리는 서버 컴포넌트인 `/settings/classification/page.tsx`에서 페칭하여 주입 가능.
    - 태깅 규칙은 클라이언트 사이드 페칭을 유지하거나, 초기 데이터만 서버에서 넘겨주는 방식 고려.
- **레이아웃 일관성**: 두 탭의 스타일(여백, 타이틀 등)을 통일하여 사용자 경험 개선.

## 3. 내비게이션 및 리다이렉트
- `settings/layout.tsx`에서 `SETTINGS_NAV` 배열 수정 필요.
- 기존 URL들(`tagging-rules`, `categories`)에 대해 `next/navigation`의 `redirect` 또는 `middleware`를 통한 리다이렉트 처리 필요.
