# 애플리케이션 구조 및 네비게이션 설계 (Architecture & Navigation Design)

## 1. 네비게이션 구조 (Navigation Structure)

### 1.1. 좌측 사이드바 (Sidebar) - 드롭다운 구조
*   **Top**: 앱 로고 및 이름 (클릭 시 `/` 대시보드로 이동)
*   **Main Menu**:
    *   `대시보드` (Home)
    *   `가계부 (Personal)` ▼
        *   `지출/수입 내역`: 최근 거래 및 상세 내역 (`/transactions`)
        *   `예산/통계`: 예산 소진 현황 및 카테고리별 통계 (`/analytics`)
    *   `사업 (Business)` ▼
        *   `프로젝트`: 현재 진행 프로젝트 및 타임라인 (`/business/projects`)
        *   `미수금/수익`: 입금 확인 및 매출 관리 (`/business`)
        *   `거래처 관리`: 클라이언트 정보 (`/manage-clients` - 신규)
*   **Bottom**:
    *   `설정 (Settings)` ⚙️: 앱 및 데이터 관리 (`/settings`)

### 1.2. 전역 플로팅 버튼 (Global FAB)
*   위치: 화면 우측 하단 고정
*   기능: 퀵 액션 메뉴 트리거
    *   `지출 기입`: 가계부 기입 모달
    *   `영수증 업로드`: 촬영본/이미지 업로드
    *   `프로젝트 생성`: 사업용 퀵 프로젝트 생성

## 2. 라우팅 매핑 (Routing Mapping)

| 기존 경로 | 신규/변경 경로 | 비고 |
| :--- | :--- | :--- |
| `/` | `/` | 대시보드 전면 개편 |
| `/(dashboard)/business` | `/(dashboard)/business` | 미수금/수익 메인 화면으로 강화 |
| `/transactions` | `/personal/transactions` | 네이밍 명확화 |
| `/settings/*` | `/settings/*` | 하위 메뉴 UI 통합 및 설정 항목 보강 |
| (신규) | `/settings/master-data` | 거래처 등 기초 정보 통합 관리 |

## 3. Supabase 타입 안전성 강화 설계

### 3.1. 타입 단일화 (Single Source of Truth)
*   `src/shared/types/database.types.ts`를 유일한 타입 정의 파일로 유지.
*   `src/shared/api/supabase/types.ts`의 수동 정의를 제거하고 자동 생성된 타입을 직접 참조하도록 수정.

### 3.2. RPC 및 API 래퍼 (Type-Safe Wrappers)
*   RPC 호출 시 `Database["public"]["Functions"]` 타입을 활용한 제네릭 헬퍼 도입.
*   `payload as any`를 방지하기 위해 `Insert<"table">`, `Update<"table">` 타입 익스포트 및 적용.

## 4. UI/UX 가이드라인
*   **일관성**: Shadcn UI 기반 테마 변수를 엄격히 준수.
*   **반응형**: 데스크탑에서는 사이드바 노출, 모바일에서는 햄버거 메뉴 및 하단 탭 바 고려.
*   **시각적 계층**: 대시보드 50:50 분할 시 색상 톤(예: 가계-Blue, 사업-Green)을 활용하여 명확히 구분.
