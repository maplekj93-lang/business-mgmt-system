# 시스템 구조 및 대시보드 전면 개편 계획서

본 계획은 리서치 및 설계 단계를 바탕으로, 앱의 전체 네비게이션 구조를 현대화하고 대시보드를 직관적으로 재구성하며, 코드베이스의 Supabase 타입 안전성을 강화하는 것을 목표로 합니다.

## User Review Required

> [!IMPORTANT]
> **네비게이션 구조 변경에 따른 페이지 이동 경로 변화**가 발생합니다. 기존 상단 메뉴 방식에서 사이드바 방식으로 전환됨에 따라 사용자의 숙지가 필요합니다. 또한, `as any` 제거 과정에서 타입 오류가 발견될 경우 로직 수정이 동반될 수 있습니다.

## Proposed Changes

### 1. Navigation & Layout (우선순위: 상)
모든 기능의 진입점이 되는 네비게이션 구조를 먼저 개편합니다.

#### [MODIFY] [MainLayout](file:///Users/kwang/Desktop/business-mgmt-system/src/app/layout.tsx)
- 상단 네비게이션을 제거하고 좌측 사이드바(`Sidebar`)와 우측 메인 컨텐츠 영역으로 레이아웃 분할.
- 전역 플로팅 버튼(FAB) 컴포넌트 추가.

#### [NEW] [Sidebar](file:///Users/kwang/Desktop/business-mgmt-system/src/widgets/sidebar/ui/sidebar.tsx)
- 드롭다운 라이브러리(Shadcn Collapsible 등)를 사용한 계층형 메뉴 구현.
- 가계(Personal), 사업(Business), 설정(Settings) 메뉴 배치.

#### [NEW] [GlobalFAB](file:///Users/kwang/Desktop/business-mgmt-system/src/components/common/GlobalFAB.tsx)
- 화면 우측 하단 고정, 클릭 시 지출 기입/영수증 업로드 퀵 메뉴 노출.

---

### 2. Dashboard Redesign (우선순위: 중)
랜딩 페이지를 50:50 비율로 재구성하고 핵심 지표를 노출합니다.

#### [MODIFY] [DashboardPage](file:///Users/kwang/Desktop/business-mgmt-system/src/app/page.tsx)
- 기존 1년 요약 그래프 제거.
- `PersonalDashboard`와 `BusinessDashboard` 위젯을 50:50으로 배치.
- 당월 지출, 카드 사용량, 미수금액 등 핵심 숫자 위젯 적용.

---

### 3. Supabase Type Safety (우선순위: 중)
코드 전반의 `as any` 패턴을 제거하고 타입을 단일화합니다.

#### [DELETE] [LegacyTypes](file:///Users/kwang/Desktop/business-mgmt-system/src/shared/api/supabase/types.ts)
- 수동 관리되던 타입을 제거하고 자동 생성된 타입을 참조하도록 변경.

#### [MODIFY] [SupabaseClient](file:///Users/kwang/Desktop/business-mgmt-system/src/shared/api/supabase/client.ts)
- `Database` 타입을 명확히 바인딩하여 RPC 및 Query 호출 시 자동 추론 지원.

---

### 4. DB Migration & Verification (우선순위: 하)
긴급 작업으로 언급된 테이블 상태를 최종 점검합니다.

#### [VERIFY] Supabase DB
- `recurring_expenses` 테이블 및 RLS 정책 최종 확인.
- 미적용된 마이그레이션 파일이 있다면 수동 실행 지원.

---

### 5. Data Cleanup: 0원 거래 제거 (우선순위: 상)
의미 없는 0원 거래 내역을 제거하여 가독성을 높이고 시스템 리소스를 절약합니다.

#### [ACTION] DB Cleanup
- `transactions` 테이블에서 `amount = 0`인 행을 일괄 삭제하는 서버 사이드 스크립트 실행.

#### [MODIFY] [UploadBatch](file:///Users/kwang/Desktop/business-mgmt-system/src/features/ledger-import/api/upload-batch.ts)
- 엑셀 데이터 파싱 및 가공 단계에서 `amount === 0`인 트랜잭션을 삽입 대상에서 제외하도록 필터링 로직 추가.

---

### 6. Design System Overhaul: Premium Light Mode (우선순위: 상)
칙칙한 라이트 모드를 개선하고 테마 전환 시의 오류(하드코딩된 다크 클래스)를 해결합니다.

#### [MODIFY] [GlobalsCSS](file:///Users/kwang/Desktop/business-mgmt-system/src/app/globals.css)
- `:root` (Light Mode) 팔레트 재설계: 순백색 대신 눈이 편안한 Soft White-Blue(`220 33% 98%`) 배경 적용.
- Primary/Secondary 컬러에 더 생동감 있는 채도 부여.
- 다크 모드와 라이트 모드 간의 색상 대비 밸런스 조정.

#### [MODIFY] Layout Components
- **[Header](file:///Users/kwang/Desktop/business-mgmt-system/src/widgets/layout/ui/header.tsx)**: `bg-zinc-950` 등 하드코딩된 클래스를 `bg-background/80` 및 `border-border`로 변경.
- **[Sidebar](file:///Users/kwang/Desktop/business-mgmt-system/src/widgets/sidebar/ui/sidebar.tsx)**: 다크 모드 전용 배경색을 제거하고 테마 대응 배경색 적용.

---

## Verification Plan

### Automated Tests
- `npm run build`: 전체 프로젝트 빌드 및 타입 체크(`tsc`)를 통한 검증.
- `light/dark switch check`: 각 페이지에서 테마 전환 시 레이아웃 깨짐이나 글자 가독성 이슈 확인.

### Manual Verification
- **라이트 모드 미적 감각**: 칙칙함이 사라지고 색상이 조화롭게 배치되었는지 확인.
- **눈 피로도**: 장시간 사용 시에도 눈이 아프지 않은 배경색 농도 확인.
- **컴포넌트 일관성**: 모든 카드, 테이블, 버튼이 라이트 모드에서도 프리미엄한 질감을 유지하는지 확인.
