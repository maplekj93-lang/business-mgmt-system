# 🎯 스마트 태깅 + 모바일 UX 구현 완벽 가이드

> **작성자:** Claude (설계 담당)
> **대상:** Antigravity (구현 담당)
> **버전:** V1.0 (Complete Implementation Guide)
> **상태:** 설계 100% 완료 → 구현 시작 준비

---

## 📌 이 문서는 무엇인가?

현재까지의 모든 설계, 검토, 분석을 **일관성 있게 정리**한 최종 구현 가이드입니다.

- ✅ Smart Tagging Part 1-3 (성능 + 상세 + 정밀)
- ✅ Mobile UX (반응형 사이드바 + 행 인터랙션)
- ✅ 모든 체크리스트 통합
- ✅ 구현 순서 최적화

---

## 🗺 구현 범위 (Scope)

### 포함되는 기능

| 기능 | 파일 수 | 우선순위 | 신규/수정 |
|------|--------|----------|----------|
| **Part 3: 단건 로직** | 1 | P0 | 수정 |
| **Part 2: 상세 패널** | 5 | P0 | 신규 4 + 수정 1 |
| **Mobile UX: 사이드바** | 6 | P0 | 신규 3 + 수정 3 |
| **Part 1: 성능 최적화** | 3 | P1 | 신규 1 + 수정 2 |
| **Mobile UX: 행 인터랙션** | 2 | P2 | 신규 1 + 수정 1 |
| **총 계** | **17개 파일** | - | 신규 9 + 수정 8 |

### 포함되지 않는 것

- Phase 4 (기업 ERP 구축) → 장기 계획
- Sprint 2 구현 → 이후 작업
- 파일 업로드 폴백 → 추후 확인 후 진행
- 하단 네비게이션 → Phase 2

---

## 🎬 실행 계획 (Step by Step)

### Phase 0: 준비 (모두 동일)

#### 0-1. 검증

**목표:** DB 마이그레이션 확인

**작업:**
```bash
# Supabase SQL Editor에서 실행
SELECT column_name FROM information_schema.columns
WHERE table_name = 'mdt_allocation_rules'
  AND column_name IN ('is_business', 'business_tag', 'match_type', 'priority');

SELECT column_name FROM information_schema.columns
WHERE table_name = 'transactions'
  AND column_name = 'excluded_from_personal';

SELECT column_name FROM information_schema.columns
WHERE table_name = 'assets'
  AND column_name IN ('name', 'owner_type');
```

**결과:**
- ✅ 모두 있음 → Phase 1 시작
- ❌ 일부 없음 → DB_MIGRATION_CHECKLIST_20260311.md의 SQL 실행

**관련 문서:** `DB_MIGRATION_CHECKLIST_20260311.md`

---

#### 0-2. 설계 이해

**목표:** 구현 전 전체 구조 파악

**순서대로 읽기:**
1. Smart_Tagging_Optimization.md (Part 1-3)
2. Mobile_UX_Optimization.md (섹션 1-2)
3. ANTIGRAVITY_EXECUTION_ROADMAP_20260311.md

**체크:**
- [ ] Part 3 단건 로직 이해 (trim/toLowerCase, priority 정렬)
- [ ] Part 2 반응형 설계 이해 (isMobile 분기)
- [ ] Mobile UX Provider 패턴 이해
- [ ] 전체 파일 구조 파악

---

#### 0-3. 준비

**목표:** 로컬 환경 설정

**작업:**
```bash
# Branch 생성
git checkout main
git pull
git checkout -b feat/smart-tagging-mobile-ux-20260311

# 폴더 구조 확인
ls -la src/features/refine-ledger/ui/
ls -la src/shared/ui/sidebar/
ls -la src/shared/hooks/

# 필요시 폴더 생성
mkdir -p src/shared/hooks
mkdir -p src/shared/ui/sidebar
```

**체크:**
- [ ] Branch 생성됨
- [ ] 기존 파일들 위치 확인
- [ ] node_modules 설치 (npm install 필요시)

---

### Phase 1: P0 (필수 기능)

#### 1-1. Part 3: 단건 로직 개선

**목표:** 대소문자/공백 처리 강화 + Priority 정렬

**파일:** `src/features/refine-ledger/api/suggest-category.ts`

**작업 1: 전처리 추가**
```ts
// 기존 코드
export async function suggestCategory(description: string) {
  // ... 루프

// 변경 후
export async function suggestCategory(description: string) {
  const cleanDesc = description.trim().toLowerCase()
  // ... 루프에서 cleanDesc 사용
```

**작업 2: Exact Match 수정**
```ts
// 기존
const exact = rules.find(r =>
  r.match_type === 'exact' &&
  r.keyword === desc
)

// 변경 후
const exact = rules.find(r =>
  r.match_type === 'exact' &&
  r.keyword.trim().toLowerCase() === cleanDesc
)
```

**작업 3: Contains Match 개선**
```ts
// 기존
const contains = rules.find(r =>
  r.match_type === 'contains' &&
  desc.includes(r.keyword)
)

// 변경 후
const contains = rules
  .filter(r => r.match_type === 'contains')
  .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
  .find(r => cleanDesc.includes(r.keyword.trim().toLowerCase()))
```

**작업 4: History Match 검토**
```ts
// History 비교 시 trim() 적용 검토
// 현재 구조에 따라 정규화 추가
```

**검증:**
```ts
// 테스트 케이스
suggestCategory('STARBUCKS')     // ✅ 'Starbucks' 규칙과 매칭
suggestCategory(' 스타벅스 ')    // ✅ '스타벅스' 규칙과 매칭
suggestCategory('starbucks')     // ✅ 모두 동일한 규칙으로 매칭

// priority 테스트
// 'Cafe' vs 'Coffee' 규칙이 있을 때
suggestCategory('cafe coffee')   // priority 낮은 것이 먼저 매칭됨
```

**완료 체크:**
- [ ] suggest-category.ts 수정됨
- [ ] 테스트 케이스 3개 모두 통과
- [ ] Git 스테이징

**참고:** Smart_Tagging_Optimization.md Part 3-2, 3-3, 3-4

---

#### 1-2. Part 2: 미분류 상세 패널

**목표:** 거래 상세 정보 표시 + 반응형 렌더링

**파일 1: `src/entities/transaction/api/get-transactions-by-ids.ts` (신규)**

**구현:**
```ts
import { supabase } from '@/shared/api/supabase'
import { TransactionDetail } from '../types'

export interface TransactionDetail {
  id: string
  date: string
  amount: number
  description: string
  asset_name?: string      // 계좌/카드명
  asset_owner?: string     // 광준/의영/공동
  receipt_memo?: string    // 메모/비고
  source_raw_data?: Record<string, unknown>
}

export async function getTransactionsByIds(
  ids: string[]
): Promise<TransactionDetail[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      id,
      date,
      amount,
      description,
      receipt_memo,
      assets!asset_id (
        name,
        owner_type
      ),
      source_raw_data
    `)
    .in('id', ids)
    .order('date', { ascending: false })

  if (error) throw error

  return (data || []).map(row => ({
    id: row.id,
    date: row.date,
    amount: row.amount,
    description: row.description,
    asset_name: row.assets?.name,
    asset_owner: row.assets?.owner_type,
    receipt_memo: row.receipt_memo,
    source_raw_data: row.source_raw_data
  }))
}
```

**체크:**
- [ ] Asset FK 이름 확인 (asset_id 또는 다른 이름)
- [ ] JOIN 구조 정확
- [ ] 필드 모두 포함

**파일 2: `src/features/refine-ledger/ui/transaction-detail-panel.tsx` (신규)**

**구현:**
```tsx
'use client'

import { TransactionDetail } from '@/entities/transaction'

interface TransactionDetailPanelProps {
  details: TransactionDetail[] | null
  isLoading: boolean
}

export function TransactionDetailPanel({
  details,
  isLoading,
}: TransactionDetailPanelProps) {
  if (isLoading) {
    return <div className="p-4 text-xs text-muted-foreground">로딩 중...</div>
  }

  if (!details) return null

  return (
    <div className="px-4 py-3 border-t border-dashed">
      <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">
        개별 거래 내역 ({details.length}건)
      </p>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted-foreground">
            <th className="text-left py-1 w-[120px]">날짜</th>
            <th className="text-right py-1 w-[100px]">금액</th>
            <th className="text-left py-1 w-[180px]">계좌/카드</th>
            <th className="text-left py-1">메모</th>
          </tr>
        </thead>
        <tbody>
          {details.map(tx => (
            <tr key={tx.id} className="border-t border-muted/30">
              <td className="py-1 font-mono text-muted-foreground">{tx.date}</td>
              <td className="py-1 text-right font-medium">
                {tx.amount < 0 ? '' : '+'}{tx.amount.toLocaleString()}원
              </td>
              <td className="py-1">
                {tx.asset_owner && (
                  <span className="text-[10px] bg-muted rounded px-1 mr-1">
                    {tx.asset_owner}
                  </span>
                )}
                {tx.asset_name ?? <span className="text-muted-foreground">-</span>}
              </td>
              <td className="py-1 text-muted-foreground">
                {tx.receipt_memo ?? '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

**체크:**
- [ ] 테이블 스타일 적용
- [ ] 필드 모두 표시됨

**파일 3: `src/features/refine-ledger/ui/transaction-detail-sheet.tsx` (신규)**

**구현:**
```tsx
'use client'

import { X } from 'lucide-react'
import { TransactionDetail } from '@/entities/transaction'

interface TransactionDetailSheetProps {
  details: TransactionDetail[] | null
  isLoading: boolean
  onClose: () => void
}

export function TransactionDetailSheet({
  details,
  isLoading,
  onClose,
}: TransactionDetailSheetProps) {
  if (isLoading) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
          <div className="bg-background rounded-t-lg max-h-[80vh] overflow-y-auto">
            <div className="p-4 text-xs text-muted-foreground">로딩 중...</div>
          </div>
        </div>
      </>
    )
  }

  if (!details) return null

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

**체크:**
- [ ] md:hidden 클래스 (데스크톱에서는 보이지 않음)
- [ ] 오버레이 클릭 시 닫기
- [ ] 로딩 상태 처리

**파일 4: `src/features/refine-ledger/ui/unclassified-row.tsx` (신규)**

**구현:**
```tsx
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { TableRow, TableCell } from '@/shared/ui/table'
import { useMediaQuery } from '@/shared/hooks/use-media-query'
import { getTransactionsByIds } from '@/entities/transaction/api/get-transactions-by-ids'
import { TransactionDetailPanel } from './transaction-detail-panel'
import { TransactionDetailSheet } from './transaction-detail-sheet'
import type { TransactionDetail } from '@/entities/transaction'

export function UnclassifiedRow({ group, categories, businessUnits }) {
  const [expanded, setExpanded] = useState(false)
  const [details, setDetails] = useState<TransactionDetail[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const isMobile = useMediaQuery('(max-width: 767px)')

  const handleRowClick = async () => {
    if (!expanded && !details) {
      setIsLoading(true)
      try {
        const data = await getTransactionsByIds(group.transactionIds)
        setDetails(data)
      } finally {
        setIsLoading(false)
      }
    }
    setExpanded(prev => !prev)
  }

  return (
    <>
      {/* 기존 TableRow */}
      <TableRow
        onClick={handleRowClick}
        className="cursor-pointer hover:bg-muted/30 transition-colors"
      >
        {/* 기존 셀들 (그대로) */}
        {/* ... */}
        <TableCell className="w-6">
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </TableCell>
      </TableRow>

      {/* 상세 렌더링 분기 */}
      {expanded && isMobile ? (
        // 모바일: Bottom Sheet
        <TransactionDetailSheet
          details={details}
          isLoading={isLoading}
          onClose={() => setExpanded(false)}
        />
      ) : expanded && !isMobile ? (
        // 데스크톱/태블릿: 인라인 패널
        <TableRow>
          <TableCell colSpan={8} className="p-0 bg-muted/10">
            <TransactionDetailPanel details={details} isLoading={isLoading} />
          </TableCell>
        </TableRow>
      ) : null}
    </>
  )
}
```

**체크:**
- [ ] BulkAssigner import 제거 (이 컴포넌트에서는 필요 없음)
- [ ] 기존 행 셀들 그대로 유지
- [ ] isMobile 분기 논리 확인

**파일 5: `/transactions/unclassified/page.tsx` (수정)**

**작업:**
```tsx
// 기존
{groups.map((group) => (
  <TableRow key={...}>
    {/* ... */}
    <BulkAssigner group={group} ... />
  </TableRow>
))}

// 변경 후
{groups.map((group) => (
  <UnclassifiedRow
    key={group.rawName + group.amount + group.ownerType + group.type}
    group={group}
    categories={structuredCategories}
    businessUnits={businessUnits}
  />
))}
```

**체크:**
- [ ] UnclassifiedRow import 추가
- [ ] groups.map() 구조만 변경 (데이터 로딩은 그대로)

**검증:**
```
✅ 데스크톱에서 행 클릭 → 인라인 패널 펼침
✅ 패널에서 날짜, 금액, 계좌/카드, 메모 표시됨
✅ 재클릭 → 패널 접힘
✅ 모바일에서 행 탭 → Bottom Sheet 오픈
✅ Sheet에서 동일한 정보 표시됨
✅ X 버튼 또는 배경 클릭 → Sheet 닫힘
```

**완료 체크:**
- [ ] 5개 파일 모두 생성/수정됨
- [ ] 데스크톱 테스트 통과
- [ ] 모바일 (DevTools 768px 이하) 테스트 통과
- [ ] Git 스테이징

**참고:** Smart_Tagging_Optimization.md Part 2-3, 2-4, 2-5

---

#### 1-3. Mobile UX: 반응형 사이드바

**목표:** 모든 디바이스에서 반응형 사이드바 구현

**파일 1: `src/shared/hooks/use-media-query.ts` (신규)**

**구현:**
```tsx
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

**체크:**
- [ ] SSR 문제 없음 (초기값 false)
- [ ] 리스너 정리 (cleanup)

**파일 2: `src/shared/ui/sidebar/sidebar-provider.tsx` (신규)**

**구현:**
```tsx
'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { useMediaQuery } from '@/shared/hooks/use-media-query'

interface SidebarContextType {
  isOpen: boolean
  toggle: () => void
  isCollapsed: boolean
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

**체크:**
- [ ] Context 초기값 처리
- [ ] 데스크톱에서는 toggle 작동 안 함
- [ ] 태블릿에서 isCollapsed 논리 정확

**파일 3: `src/shared/ui/header/mobile-menu-button.tsx` (신규)**

**구현:**
```tsx
import { Menu, X } from 'lucide-react'
import { Button } from '@/shared/ui/button'

interface MobileMenuButtonProps {
  onClick: () => void
  isOpen: boolean
}

export function MobileMenuButton({ onClick, isOpen }: MobileMenuButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="md:hidden"  // 데스크톱에서는 숨김
    >
      {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
    </Button>
  )
}
```

**체크:**
- [ ] md:hidden 적용 (1024px 이상에서 숨김)
- [ ] 아이콘 변경 (열림 ↔ 닫힘)

**파일 4: `src/shared/ui/header/header.tsx` (수정)**

**작업:**
```tsx
import { MobileMenuButton } from './mobile-menu-button'
import { useSidebar } from '../sidebar/sidebar-provider'

export function Header() {
  const { isOpen, toggle } = useSidebar()

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b">
      <MobileMenuButton onClick={toggle} isOpen={isOpen} />
      {/* 기존 헤더 내용 */}
    </header>
  )
}
```

**체크:**
- [ ] useSidebar import 추가
- [ ] MobileMenuButton 컴포넌트 import 추가
- [ ] 기존 헤더 로직은 그대로

**파일 5: `src/shared/ui/sidebar/sidebar.tsx` (수정)**

**작업:**
```tsx
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
          {/* 메뉴 컨텐츠 (기존 그대로) */}
        </aside>
      </div>
    ) : null
  }

  // 태블릿: 아이콘만 또는 펼침
  if (isCollapsed) {
    return <aside className="w-16 border-r">{/* 아이콘 버전 */}</aside>
  }

  // 데스크톱: 기본 펼침
  return <aside className="w-64 border-r">{/* 전체 메뉴 (기존 그대로) */}</aside>
}
```

**체크:**
- [ ] 모바일 Slide-over 배경 클릭 닫기 로직 구현 (또는 useSidebar().toggle() 호출)
- [ ] isCollapsed 분기 정확

**파일 6: `src/app/(dashboard)/layout.tsx` (수정)**

**작업:**
```tsx
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

**체크:**
- [ ] grid-cols 동적 변경 (4rem vs 16rem)
- [ ] transition 부드러움
- [ ] 기존 구조 유지

**그 외:**
- [ ] app/layout.tsx에서 SidebarProvider 래핑 필요
  ```tsx
  import { SidebarProvider } from '@/shared/ui/sidebar/sidebar-provider'

  export default function RootLayout({ children }) {
    return (
      <html>
        <body>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </body>
      </html>
    )
  }
  ```

**검증:**
```
✅ 1024px+: 사이드바 w-64 고정
✅ 768~1023px: 초기 w-64 → 햄버거 클릭 → w-16 → 재클릭 → w-64
✅ <768px: 초기 숨김 → 햄버거 클릭 → Slide-over 오픈 → 배경/X 클릭 → 닫힘
✅ 브라우저 DevTools 리사이징 시 실시간 반응
```

**완료 체크:**
- [ ] 6개 파일 모두 생성/수정됨
- [ ] 모든 breakpoint 테스트 통과
- [ ] Git 스테이징

**참고:** Mobile_UX_Optimization.md 1-2, 1-3

---

### Phase 2: P1 (권장 기능)

#### 2-1. Part 1: 성능 최적화

**목표:** N+1 쿼리 해결 (202+N → 5회)

**파일 1: `src/features/refine-ledger/api/suggest-category-bulk.ts` (신규)**

**구현:**
```ts
import { supabase } from '@/shared/api/supabase'
import type { Database } from '@/shared/api/supabase/database.types'

export async function suggestCategoryBulk(descriptions: string[]): Promise<Map<string, SuggestionResult>> {
  const user = await getCurrentUser()  // 기존 auth 함수 사용
  const resultMap = new Map<string, SuggestionResult>()

  // Step 1: 규칙 일괄 로드 (1회 쿼리)
  const { data: rules, error: rulesError } = await supabase
    .from('mdt_allocation_rules')
    .select('keyword, match_type, priority, category_id, is_business, mdt_categories(name)')
    .eq('user_id', user.id)
    .order('priority', { ascending: true })

  if (rulesError) throw rulesError

  // Step 2: History 벌크 집계 (1회 쿼리)
  const { data: historyRows, error: historyError } = await supabase
    .from('transactions')
    .select(`
      description,
      category_id,
      mdt_categories(name)
    `)
    .eq('user_id', user.id)
    .in('description', descriptions)
    .not('category_id', 'is', null)

  if (historyError) throw historyError

  // Step 3: History를 Map으로 변환 (최빈값)
  const historyMap = new Map<string, { category_id: number; category_name: string; count: number }>()
  const countrMap = new Map<string, number>()

  historyRows?.forEach(row => {
    const key = row.description
    const count = (countrMap.get(key) || 0) + 1
    countrMap.set(key, count)

    const existing = historyMap.get(key)
    if (!existing || count > existing.count) {
      historyMap.set(key, {
        category_id: row.category_id,
        category_name: row.mdt_categories?.name || '',
        count
      })
    }
  })

  // Step 4: 인메모리 매칭 (쿼리 0회)
  for (const desc of descriptions) {
    const cleanDesc = desc.trim().toLowerCase()

    // 1단계: exact match
    const exact = rules?.find(r =>
      r.match_type === 'exact' &&
      r.keyword.trim().toLowerCase() === cleanDesc
    )
    if (exact) {
      resultMap.set(desc, {
        ...exact,
        confidence: 'high',
        rule_type: 'exact'
      })
      continue
    }

    // 2단계: contains match
    const contains = rules
      ?.filter(r => r.match_type === 'contains')
      .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
      .find(r => cleanDesc.includes(r.keyword.trim().toLowerCase()))

    if (contains) {
      resultMap.set(desc, {
        ...contains,
        confidence: 'medium',
        rule_type: 'keyword'
      })
      continue
    }

    // 3단계: history match
    const history = historyMap.get(desc)
    if (history) {
      const conf = history.count >= 5 ? 'medium' : 'low'
      resultMap.set(desc, {
        ...history,
        confidence: conf,
        rule_type: 'history'
      })
    }
  }

  return resultMap
}
```

**Step 5: 벌크 업데이트는 apply-tagging-rules.ts에서**

**체크:**
- [ ] supabase query 구문 정확
- [ ] historyMap 로직 (최빈값 + count)
- [ ] cleanDesc 정규화 적용
- [ ] priority 정렬

**파일 2: `src/features/refine-ledger/api/apply-tagging-rules.ts` (수정)**

**작업:**
```ts
// 기존
for (const tx of transactions) {
  const suggestion = await suggestCategory(tx.description)
  if (suggestion?.confidence === 'high') {
    toUpdate.push({ id: tx.id, category_id: suggestion.category_id })
  }
}

// 변경 후
const descriptions = transactions.map(tx => tx.description)
const suggestions = await suggestCategoryBulk(descriptions)

const toUpdate = transactions
  .filter(tx => {
    const suggestion = suggestions.get(tx.description)
    return suggestion?.confidence === 'high'
  })
  .map(tx => ({
    id: tx.id,
    category_id: suggestions.get(tx.description)?.category_id
  }))
```

**체크:**
- [ ] suggestCategoryBulk 호출 한 번만
- [ ] Map에서 suggestions 조회
- [ ] 나머지 로직 유지

**파일 3: `src/features/refine-ledger/ui/auto-apply-rules-button.tsx` (수정)**

**작업:**
```tsx
// 기존
toast.loading(`⚡ ${count}건 자동 분류 처리 중...`)

// 변경 후
const toastId = toast.loading(`⚡ ${count}건 자동 분류 처리 중...`)

// 완료 후
toast.success(
  `✅ 자동 적용 ${result.auto_applied}건 · 추천 ${result.suggested}건 · 미분류 ${result.unmatched}건`,
  { id: toastId }
)
```

**체크:**
- [ ] 토스트 단일 메시지 (완료 후)
- [ ] 진행률 없음 (Server Action 한계)

**검증:**
```bash
# Supabase Logs 확인
# Executions 탭에서 쿼리 수 확인
# 100건 처리 시:
✅ 1 (user 조회) + 1 (transactions) + 1 (rules) + 1 (history) + 1 (update) = 5회
```

**완료 체크:**
- [ ] 3개 파일 모두 수정됨
- [ ] 100건 테스트: 쿼리 5회 확인
- [ ] 토스트 메시지 정상
- [ ] Git 스테이징

**참고:** Smart_Tagging_Optimization.md Part 1-2, 1-3, 1-4

---

### Phase 3: P2 (마지막 - 모바일)

#### 3-1. Mobile UX: 행 인터랙션 (이미 구현됨)

**상태:** Part 2에서 이미 `transaction-detail-sheet.tsx` 구현됨

**확인:**
- [ ] TransactionDetailSheet 모바일에서만 표시 (md:hidden)
- [ ] UnclassifiedRow의 isMobile 분기 정상

**추가 작업:** 없음 (이미 완료)

---

## 🧪 통합 테스트 (모든 파트 완료 후)

### 테스트 체크리스트

#### Part 3 테스트
```
[ ] 'STARBUCKS' 입력 → 'Starbucks' 규칙 매칭
[ ] ' 스타벅스 ' 입력 → '스타벅스' 규칙 매칭
[ ] 'Cafe' vs 'Coffee' priority 정렬 동작
```

#### Part 2 테스트
```
[ ] 데스크톱 (1024px+)
    [ ] 미분류 행 클릭 → 인라인 패널 펼침
    [ ] 날짜, 금액, 계좌, 메모 정상 표시
    [ ] 재클릭 → 패널 접힘

[ ] 태블릿 (768~1023px, DevTools)
    [ ] 행 클릭 → 인라인 패널 펼침 (사이드바 아이콘 상태)

[ ] 모바일 (<768px, DevTools)
    [ ] 행 탭 → Bottom Sheet 오픈
    [ ] 동일 정보 표시됨
    [ ] X 또는 배경 클릭 → 닫힘
```

#### Mobile UX 테스트
```
[ ] 데스크톱 (1024px+)
    [ ] 사이드바 w-64 고정
    [ ] 햄버거 버튼 보이지 않음

[ ] 태블릿 (768~1023px, DevTools)
    [ ] 초기: 사이드바 w-64
    [ ] 햄버거 클릭 → w-16 (아이콘만)
    [ ] 재클릭 → w-64 (펼침)

[ ] 모바일 (<768px, DevTools)
    [ ] 초기: 사이드바 숨김
    [ ] 햄버거 클릭 → Slide-over 오픈
    [ ] 배경 또는 아이콘 클릭 → 닫힘
```

#### 성능 테스트
```
[ ] Supabase Logs 확인
    [ ] 100건 자동 분류 시 쿼리 5회 이하
    [ ] 시간(latency) 기록
```

---

## 📋 최종 커밋 전 체크리스트

### 코드 품질

```
[ ] TypeScript 타입 에러 없음
    npm run type-check

[ ] ESLint 경고/에러 없음
    npm run lint

[ ] 기존 테스트 모두 통과
    npm test

[ ] 빌드 성공
    npm run build
```

### 기능 검증

```
[ ] Part 3: 대소문자/공백 테스트 (3개 케이스)
[ ] Part 2: 반응형 테스트 (3개 디바이스)
[ ] Mobile UX: Breakpoint 테스트 (3개 구간)
[ ] Performance: 쿼리 수 확인 (5회)
```

### Git 커밋

```bash
# 각 파트별 분리 커밋 권장

git add src/features/refine-ledger/api/suggest-category.ts
git commit -m "Part 3: Smart Tagging 단건 로직 개선 (trim/toLowerCase, priority 정렬)"

git add src/entities/transaction/api/get-transactions-by-ids.ts \
        src/features/refine-ledger/ui/transaction-detail-panel.tsx \
        src/features/refine-ledger/ui/transaction-detail-sheet.tsx \
        src/features/refine-ledger/ui/unclassified-row.tsx \
        src/app/\(dashboard\)/transactions/unclassified/page.tsx
git commit -m "Part 2: 미분류 거래 상세 패널 구현 (반응형)"

git add src/shared/hooks/use-media-query.ts \
        src/shared/ui/sidebar/sidebar-provider.tsx \
        src/shared/ui/header/mobile-menu-button.tsx \
        src/shared/ui/header/header.tsx \
        src/shared/ui/sidebar/sidebar.tsx \
        src/app/\(dashboard\)/layout.tsx \
        src/app/layout.tsx
git commit -m "Mobile UX: 반응형 사이드바 구현"

git add src/features/refine-ledger/api/suggest-category-bulk.ts \
        src/features/refine-ledger/api/apply-tagging-rules.ts \
        src/features/refine-ledger/ui/auto-apply-rules-button.tsx
git commit -m "Part 1: N+1 쿼리 최적화 (벌크 처리, 5회 고정)"
```

---

## 🔧 문제 해결 (Troubleshooting)

### 타입 에러

#### "TransactionDetail을 찾을 수 없음"
```
해결:
1. src/entities/transaction/types.ts에 정의되어 있는지 확인
2. 없으면 신규 생성:
   interface TransactionDetail { ... }
3. export해서 임포트
```

#### "useMediaQuery가 false만 반환"
```
해결:
1. 초기값이 false인 건 정상 (SSR 때문)
2. useEffect에서 실제 값으로 업데이트됨
3. 콘솔에서 값 확인: console.log(isMobile)
```

### DB 쿼리 에러

#### "asset_id FK 찾을 수 없음"
```
해결:
1. transactions 테이블 구조 확인
   SELECT * FROM transactions LIMIT 1
2. FK 컬럼명이 다르면 JOIN 수정
3. LEFT JOIN 사용 (asset 없을 수도)
```

#### "priority 컬럼이 없어요"
```
해결:
DB_MIGRATION_CHECKLIST_20260311.md의 마이그레이션 SQL 실행
```

### 렌더링 문제

#### "모바일에서도 인라인 패널이 보여요"
```
해결:
1. useMediaQuery가 제대로 값을 반환하는지 확인
2. 브라우저 DevTools에서 실제 768px 이하인지 확인
3. 캐시 제거: Shift+Ctrl+R (또는 Cmd+Shift+R)
```

#### "Slide-over가 안 열려요"
```
해결:
1. z-index 확인 (z-40 배경, z-50 시트)
2. SidebarProvider가 app/layout.tsx에서 래핑되었는지 확인
3. useSidebar() 훅이 Provider 내부에서 호출되는지 확인
```

### 성능 문제

#### "Part 1 후에도 쿼리가 많아요"
```
해결:
1. suggestCategoryBulk가 호출되고 있는지 확인
2. Supabase 로그에서 실제 쿼리 수 세기
3. apply-tagging-rules.ts에서 루프 제거됐는지 확인
```

---

## 📚 참고 문서

| 문서 | 용도 |
|------|------|
| `Smart_Tagging_Optimization.md` (V2.1) | Part 1-3 상세 설계 |
| `Mobile_UX_Optimization.md` (V1.1) | 반응형 UI 설계 |
| `DB_MIGRATION_CHECKLIST_20260311.md` | DB 검증 |
| `ANTIGRAVITY_EXECUTION_ROADMAP_20260311.md` | 순서 및 체크리스트 |
| `REVIEW_SUMMARY_20260311.md` | 검토 내용 |

---

## ✨ 완료 기준

### 구현 완료
```
✅ Part 3: suggest-category.ts 수정됨
✅ Part 2: 5개 파일 생성/수정됨
✅ Mobile UX: 6개 파일 생성/수정됨
✅ Part 1: 3개 파일 생성/수정됨
```

### 테스트 통과
```
✅ TypeScript 빌드 성공
✅ 모든 테스트 통과
✅ 기능 테스트 (디바이스별, 쿼리)
✅ 성능 목표 달성 (쿼리 5회)
```

### 준비 완료
```
✅ 모든 커밋 완료
✅ PR 올림
✅ 리뷰 대기
```

---

## 🎉 마지막 조언

1. **분할 구현:** 파트별로 나누어 진행 → 각각 테스트 후 커밋
2. **문서 참고:** 헷갈릴 때 설계 문서 다시 읽기 (코드 예시 있음)
3. **막히면 물어보기:** "이 부분 모르는데" → CLAUDE가 도와줌
4. **테스트 먼저:** 각 파트 완료 후 즉시 수동 테스트
5. **커밋 명확하게:** 각 파트가 명확히 구분되도록

---

**이제 시작할 준비가 됐습니다! 🚀**

의문 사항이 생기면 이 문서의 "문제 해결" 섹션을 먼저 확인하고, 없으면 CLAUDE에게 물어보세요.

**화이팅! 💪**
