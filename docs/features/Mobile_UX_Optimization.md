# 모바일(iPad/iPhone) UX 최적화 설계 (V1.1)

> **버전:** V1.1 (구체화 + Smart Tagging 통합)
> **상태:** 설계 완료 / MVP 구현 준비 (부분)
> **수정 사항:**
> - 1-1: 반응형 사이드바 구현 순서 구체화
> - 2-1: Smart Tagging 상세 패널과의 행 인터랙션 통합 설계
> - 3-1: 하단 네비게이션을 Phase 2로 연기

---

## 1. 사이드바 토글 시스템 (Sidebar Toggle)

현재 사이드바는 데스크톱 중심의 고정형 구조(`w-64`)입니다. 이를 반응형으로 개선합니다.

### 1-1. Breakpoint 별 동작 및 구현 순서

#### 데스크톱 (≥1024px)
- 기본적으로 펼쳐진 상태 유지.
- 선택적으로 서랍(Drawer) 방식으로 접기 가능.

#### 태블릿 (768px ~ 1023px, iPad)
- 아이콘만 노출되는 **Collapsed Sidebar** 모드 지원.
- 상단 헤더의 햄버거 버튼을 통해 전체 메뉴 확장 가능.
- 상태: `sidebarOpen = true` (펼쳐짐) / `false` (아이콘만)

#### 모바일 (< 768px, iPhone)
- 사이드바는 기본적으로 숨김 처리.
- 헤더의 메뉴 버튼(≡ 아이콘) 클릭 시 **Overlay Sheet (Slide-over)** 형태로 노출.
- 상태: `sidebarOpen = false` (숨김) → 클릭 시 `true` (Slide-over 열림)

---

### 1-2. 구현 계획 (구체화)

**파일 구조:**
```
src/
├── shared/
│   └── ui/
│       ├── sidebar/
│       │   └── sidebar-provider.tsx        ← 신규: 전역 상태 관리
│       ├── header/
│       │   ├── header.tsx                   ← 수정: 토글 버튼 추가
│       │   └── mobile-menu-button.tsx       ← 신규: 모바일 전용
│       └── layout/
│           └── responsive-layout.tsx       ← 신규: breakpoint 기반 렌더링
└── app/
    ├── layout.tsx                           ← 수정: SidebarProvider 래퍼
    └── (dashboard)/
        └── layout.tsx                       ← 수정: grid 동적 조정
```

**Step 1: SidebarProvider 생성**
```tsx
// src/shared/ui/sidebar/sidebar-provider.tsx (신규)
'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { useMediaQuery } from '@/shared/hooks/use-media-query'

interface SidebarContextType {
  isOpen: boolean
  toggle: () => void
  isCollapsed: boolean  // 태블릿용
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)

  const isMobile = useMediaQuery('(max-width: 767px)')
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')

  const toggle = () => {
    if (isMobile || isTablet) {
      setIsOpen(prev => !prev)
    }
  }

  const isCollapsed = isTablet && !isOpen

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, isCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider')
  return ctx
}
```

**Step 2: Header 수정 (토글 버튼 추가)**
```tsx
// src/shared/ui/header/header.tsx (수정)
import { MobileMenuButton } from './mobile-menu-button'
import { useSidebar } from '../sidebar/sidebar-provider'

export function Header() {
  const { isOpen, toggle } = useSidebar()

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b">
      <MobileMenuButton onClick={toggle} isOpen={isOpen} />
      {/* ... 기존 헤더 내용 ... */}
    </header>
  )
}
```

**Step 3: Sidebar 수정 (반응형 클래스)**
```tsx
// src/shared/ui/sidebar/sidebar.tsx (수정)
import { useSidebar } from './sidebar-provider'
import { useMediaQuery } from '@/shared/hooks/use-media-query'

export function Sidebar() {
  const { isOpen, isCollapsed } = useSidebar()
  const isMobile = useMediaQuery('(max-width: 767px)')

  // 모바일: 숨김 또는 Slide-over
  if (isMobile) {
    return isOpen ? (
      <div className="fixed inset-0 z-40 md:hidden">
        <div className="absolute inset-0 bg-black/50" onClick={() => {/* close */}} />
        <aside className="absolute left-0 top-0 h-full w-64 bg-background">
          {/* 메뉴 컨텐츠 */}
        </aside>
      </div>
    ) : null
  }

  // 태블릿: 아이콘만 또는 펼침
  if (isCollapsed) {
    return <aside className="w-16 border-r">{/* 아이콘 버전 */}</aside>
  }

  // 데스크톱: 기본 펼침
  return <aside className="w-64 border-r">{/* 전체 메뉴 */}</aside>
}
```

**Step 4: 레이아웃 동적 grid 조정**
```tsx
// src/app/(dashboard)/layout.tsx (수정)
import { useSidebar } from '@/shared/ui/sidebar/sidebar-provider'

export default function DashboardLayout({ children }) {
  const { isCollapsed } = useSidebar()

  return (
    <div className={`grid h-screen ${
      isCollapsed ? 'grid-cols-[4rem_1fr]' : 'grid-cols-[16rem_1fr]'
    } transition-all duration-300`}>
      <Sidebar />
      <div className="overflow-hidden flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
```

---

### 1-3. 필수 Utility Hook

```tsx
// src/shared/hooks/use-media-query.ts (신규)
'use client'

import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [matches, query])

  return matches
}
```

---

## 2. 행 인터랙션 패턴 (Smart Tagging과 통합)

### 2-1. 문제 및 통합 설계

`Smart_Tagging_Optimization.md` Part 2에서 미분류 항목의 상세 패널(인라인 펼침)을 설계했습니다.
이를 모바일에서 최적화하되, **동일한 논리 구조** 를 유지하고 **렌더링만 변경** 합니다.

#### 패턴 정의

| 디바이스 | 동작 | 렌더링 | 구현 |
|---------|------|--------|------|
| **데스크톱/태블릿** | 행 클릭(click) | 인라인 Collapsible 패널 펼침 | `UnclassifiedRow.tsx` 기존 설계 유지 |
| **모바일** | 행 탭(tap) | Bottom Sheet 모달 오픈 | `UnclassifiedRow.tsx` (responsive 로직) + `TransactionDetailSheet.tsx` (신규) |

#### 구현 전략

```
공유 데이터 계층:
  getTransactionsByIds() → TransactionDetail[]

컴포넌트 분리:
  UnclassifiedRow.tsx
    ├─ 행 렌더링 (모든 디바이스 공통)
    ├─ handleRowClick() 공통 로직
    └─ 상세 렌더링 방식만 분기
        ├─ (desktop/tablet) → <TransactionDetailPanel /> (인라인)
        └─ (mobile) → <TransactionDetailSheet /> (시트)
```

#### 코드 예시

```tsx
// src/features/refine-ledger/ui/unclassified-row.tsx (수정)
import { useMediaQuery } from '@/shared/hooks/use-media-query'
import { TransactionDetailPanel } from './transaction-detail-panel'
import { TransactionDetailSheet } from './transaction-detail-sheet'

export function UnclassifiedRow({ group, categories, businessUnits }) {
  const [expanded, setExpanded] = useState(false)
  const [details, setDetails] = useState<TransactionDetail[] | null>(null)

  const isMobile = useMediaQuery('(max-width: 767px)')

  const handleRowClick = async () => {
    if (!expanded && !details) {
      const data = await getTransactionsByIds(group.transactionIds)
      setDetails(data)
    }
    setExpanded(prev => !prev)
  }

  return (
    <>
      {/* 테이블 행 */}
      <TableRow
        onClick={handleRowClick}
        className="cursor-pointer hover:bg-muted/30 transition-colors"
      >
        {/* ... 기존 셀들 ... */}
      </TableRow>

      {/* 상세 렌더링 분기 */}
      {expanded && details && isMobile ? (
        // 모바일: 시트
        <TransactionDetailSheet
          details={details}
          onClose={() => setExpanded(false)}
        />
      ) : expanded && details && !isMobile ? (
        // 데스크톱/태블릿: 인라인 패널
        <TableRow>
          <TableCell colSpan={8} className="p-0 bg-muted/10">
            <TransactionDetailPanel details={details} />
          </TableCell>
        </TableRow>
      ) : null}
    </>
  )
}
```

```tsx
// src/features/refine-ledger/ui/transaction-detail-sheet.tsx (신규, 모바일 전용)
'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { TransactionDetail } from '@/entities/transaction'

interface TransactionDetailSheetProps {
  details: TransactionDetail[]
  onClose: () => void
}

export function TransactionDetailSheet({ details, onClose }: TransactionDetailSheetProps) {
  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 z-40 bg-black/50 md:hidden"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="bg-background rounded-t-lg max-h-[80vh] overflow-y-auto">
          {/* 헤더 */}
          <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b bg-background">
            <p className="text-sm font-bold">거래 상세 ({details.length}건)</p>
            <button onClick={onClose} className="p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 상세 목록 */}
          <div className="px-4 py-3 space-y-3">
            {details.map(tx => (
              <div
                key={tx.id}
                className="flex items-start justify-between gap-3 pb-3 border-b border-muted/30 last:border-0"
              >
                <div className="flex-1">
                  <p className="text-[11px] text-muted-foreground font-mono">{tx.date}</p>
                  <p className="text-sm font-medium mt-1">
                    {tx.asset_owner && (
                      <span className="inline-block text-[10px] bg-muted rounded px-2 py-0.5 mr-2">
                        {tx.asset_owner}
                      </span>
                    )}
                    {tx.asset_name ?? '—'}
                  </p>
                  {tx.receipt_memo && (
                    <p className="text-xs text-muted-foreground mt-1">{tx.receipt_memo}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">
                    {tx.amount < 0 ? '' : '+'}{tx.amount.toLocaleString()}원
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
```

---

### 2-2. 레이아웃 및 터치 인터페이스 개선

- **터치 타겟 최적화**: 버튼 및 리스트 항목의 패딩을 늘려 오클릭 방지.
  - 최소 터치 타겟: 44×44px (Apple HIG 기준)
  - 테이블 행 높이: 모바일 ≥48px, 데스크톱 ≥40px

- **모바일 전용 spacing:**
  - 버튼 간 간격: 모바일 ≥12px (손가락 터치 고려)
  - 리스트 항목 간: 모바일 ≥8px

- **스크롤 에어리어**: 모바일 브라우저의 주소창 숨김/노출에 대응하는 `h-dvh` (Dynamic Viewport Height) 적용.

---

## 3. 하단 네비게이션 (Bottom Navigation) — Phase 2 연기

> **상태:** MVP에서 제외 → Phase 2 (사용 패턴 분석 후)

**이유:**
- 현재 Slide-over 사이드바로 모든 메뉴 접근 가능
- 하단 탭 도입 시 추가 복잡성 (모바일 화면 공간 압박)
- 실 사용 데이터 없이 필요성 검증 불가

**향후 고려 사항 (Phase 2):**
- 가장 빈번하게 사용하는 기능 3~4개만 선별
- 대시보드, 미분류(배지 포함), 설정 수준
- 사용자 피드백 수집 후 결정

---

## 4. iOS/iPadOS 파일 앱 연동 (현재 상황 확인 필요)

> **상태:** 현재 코드베이스에 파일 업로드 기능 확인 후 정의 필요

**설계 원칙:**
- `<input type="file" />` 요소에 `capture` 속성 및 올바른 `accept` 타입 지정
- iOS 파일 앱 및 카메라 연동을 부드럽게 처리

**모바일 폴백 (예정):**
```tsx
// 드래그 앤 드롭을 모바일에서는 클릭 업로드로 대체
const isMobile = useMediaQuery('(max-width: 767px)')

return isMobile ? (
  <button onClick={() => fileInputRef.current?.click()}>
    파일 선택
  </button>
) : (
  <div onDrop={handleDrop} className="drag-drop-area">
    드래그 또는 클릭
  </div>
)
```

---

## ✅ MVP 구현 체크리스트

### Phase 1 (현재)

**사이드바 반응형:**
- [ ] `use-media-query.ts` 훅 생성
- [ ] `sidebar-provider.tsx` 생성 (전역 상태)
- [ ] `header.tsx` 수정 (토글 버튼 + MobileMenuButton)
- [ ] `sidebar.tsx` 수정 (breakpoint 기반 렌더링)
- [ ] `(dashboard)/layout.tsx` 수정 (grid 동적 조정)
- [ ] 검증: 768px, 1024px에서 UI 변경 확인

**행 인터랙션 (Smart Tagging 통합):**
- [ ] `transaction-detail-sheet.tsx` 신규 생성 (모바일 시트)
- [ ] `unclassified-row.tsx` 수정 (responsive 분기 로직)
- [ ] `transaction-detail-panel.tsx` 검증 (인라인 패널 동작)
- [ ] 검증: 데스크톱 클릭 vs 모바일 탭 UI 차이 확인

**터치 최적화:**
- [ ] `TableRow` 높이 모바일 48px 이상 확인
- [ ] 버튼/액션 아이템 간 spacing ≥12px 확인
- [ ] 터치 타겟 최소 44×44px 검증

### Phase 2 (이후)

- [ ] 하단 네비게이션 (사용 패턴 분석 후)
- [ ] 스와이프 액션 (성능 영향 평가 후)
- [ ] 파일 업로드 폴백 (현재 기능 확인 후)

---

## 💡 참고: 관련 문서

| 문서 | 연계 부분 | 상태 |
|------|----------|------|
| `Smart_Tagging_Optimization.md` | Part 2 행 인터랙션 | ✅ 통합됨 |
| `L_and_D_ERP_Sprint2_Design.md` | 스마트 태깅 기능 설계 | ✅ 참고 |
| `ui_patterns.md` | 컴포넌트 breakpoint 가이드 | ℹ️ 검토 필요 |
