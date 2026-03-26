# AI 자동 분류 최적화 + 미분류 거래 상세 패널 (Smart Tagging Optimization V2.1)

> **작성일:** 2026-03-11 (V2.0 초안)
> **갱신일:** 2026-03-11 (V2.1 — 모바일 UX 통합 + Part 3 완전화)
> **상태:** 설계 완료 / 구현 준비
> **V2.1 변경 사항:**
> - Part 2: 반응형 설계 추가 (모바일 Bottom Sheet 컴포넌트)
> - Part 3: Contains 우선순위 + History Match 정규화 고려사항 상세화
> - 체크리스트: 모바일 컴포넌트 + Part 3 명시
> - 통합: Mobile_UX_Optimization.md와 밀접한 연계 확립

---

## Part 1. 성능 최적화 (N+1 쿼리 개선)

### 1-1. 현황 및 문제점

현재 `applyTaggingRules(transactionIds)` 가 각 트랜잭션마다 `suggestCategory()`를 개별 호출하고,
`suggestCategory` 내부에서 매 호출 시 DB 쿼리 2회(rules 조회 + history 조회)가 발생합니다.

```
거래 100건 처리 시 실제 쿼리 수:
  auth.getUser()           →   1회
  transactions 목록        →   1회
  suggestCategory() × 100 → 100회 (rules) + 100회 (history)
  개별 update × N건        →   N회
  ─────────────────────────────────────
  최악의 경우 약 202 + N회 (100건 기준 ~250회)
```

> **참고:** 현재 데이터 규모는 300건(초기 일회성)이고 이후 신규 거래는 소량씩 유입됨.
> 따라서 이 최적화는 **사용자 경험**보다 **서버 부하 방지**가 주목적.

---

### 1-2. 개선 설계: 함수 분리 전략

> ⚠️ **V1.0 수정 사항 — 핵심:**
> `suggestCategory()`는 미분류 페이지에서 **행마다 추천 배지**를 보여줄 때 단건으로도 호출됨.
> (`bulk-assigner.tsx`의 `useEffect` → `suggestCategory(group.rawName)`)
> 따라서 기존 함수를 바꾸면 단건 추천이 깨짐. **함수를 분리**해야 함.

```
suggestCategory(description)           → 단건용, 현재 그대로 유지 (변경 없음)
suggestCategoryBulk(descriptions[])    → 벌크용, 신규 함수로 분리 (신규 생성)
```

`applyTaggingRules.ts`는 `suggestCategoryBulk`를 사용하도록 교체.
`BulkAssigner.tsx`의 useEffect는 기존 `suggestCategory` 그대로 유지.

---

### 1-3. 벌크 매칭 로직 설계

**파일:** `src/features/refine-ledger/api/suggest-category-bulk.ts` (신규)

```ts
// 처리 흐름: 사전 로드 → 인메모리 매칭 → 결과 반환
export async function suggestCategoryBulk(
  descriptions: string[]
): Promise<Map<string, SuggestionResult>>
```

**내부 구현 단계:**

**Step 1 — 규칙 일괄 로드 (1회 쿼리)**
```ts
const rules = await supabase
  .from('mdt_allocation_rules')
  .select('keyword, match_type, priority, category_id, is_business, mdt_categories(name)')
  .eq('user_id', user.id)
  .order('priority', { ascending: true })
// → 전체 룰을 메모리에 올림. 루프 안에서 쿼리 없음.
```

**Step 2 — History 벌크 집계 (1회 쿼리)**

> ⚠️ **V1.0 누락 사항 — 구체적 SQL 보완:**
```sql
-- descriptions 배열로 한 번에 집계, GROUP BY로 최빈값 추출
SELECT
  description,
  category_id,
  COUNT(*) AS cnt,
  MIN(mdt_categories.name) AS category_name
FROM transactions
JOIN mdt_categories ON mdt_categories.id = transactions.category_id
WHERE user_id = $1
  AND description = ANY($2::text[])
  AND category_id IS NOT NULL
GROUP BY description, category_id
ORDER BY description, cnt DESC
```

```ts
// JS에서 Map으로 변환: description → 최빈 category
const historyMap = new Map<string, { category_id: number; category_name: string; count: number }>()
historyRows.forEach(row => {
  const existing = historyMap.get(row.description)
  if (!existing || row.cnt > existing.count) {
    historyMap.set(row.description, { category_id: row.category_id, category_name: row.category_name, count: row.cnt })
  }
})
// → 이후 루프에서 O(1) 조회
```

**Step 3 — 인메모리 매칭 루프 (쿼리 0회)**
```ts
for (const desc of descriptions) {
  // 1단계: exact match
  const exact = rules.find(r => r.match_type === 'exact' && r.keyword === desc)
  if (exact) { resultMap.set(desc, { ...exact, confidence: 'high', rule_type: 'exact' }); continue }

  // 2단계: contains match
  const contains = rules.find(r => r.match_type === 'contains' && desc.includes(r.keyword))
  if (contains) { resultMap.set(desc, { ...contains, confidence: 'medium', rule_type: 'keyword' }); continue }

  // 3단계: history match
  const history = historyMap.get(desc)
  if (history) {
    const conf = history.count >= 5 ? 'medium' : 'low'
    resultMap.set(desc, { ...history, confidence: conf, rule_type: 'history' })
  }
}
```

**Step 4 — 벌크 업데이트 (1회 쿼리)**
```ts
// confidence='high' 항목만 자동 적용
const toUpdate = [...resultMap.entries()]
  .filter(([, v]) => v.confidence === 'high')
  .map(([desc, v]) => ({ description: desc, category_id: v.category_id, ... }))

// Supabase는 배열 upsert 지원 → 1회 쿼리로 전체 적용
await supabase.from('transactions').upsert(toUpdate)
```

**최적화 후 쿼리 수:**
```
auth.getUser()      →  1회
transactions 목록   →  1회
rules 전체 로드     →  1회
history 벌크 집계   →  1회
벌크 upsert         →  1회
────────────────────────────
총 5회 고정 (거래 수 무관)
```

---

### 1-4. `apply-tagging-rules.ts` 수정 범위

`suggestCategory` 루프를 `suggestCategoryBulk` 단일 호출로 교체.
나머지 로직(`ApplyRulesResult` 반환 구조 등)은 변경 없음.

---

### 1-5. 진행률 UX (방법 A — 토스트 단순화)

> ⚠️ **V1.0 수정 사항:** `apply-tagging-rules.ts`가 Server Action이라 클라이언트로
> 실시간 스트리밍이 불가. 300건 이하 실사용 규모에서는 방법 A로 충분.

```ts
// auto-apply-rules-button.tsx 변경
toast.loading(`⚡ ${count}건 자동 분류 처리 중...`)   // 처리 전
// 완료 후
toast.success(`✅ 자동 적용 ${result.auto_applied}건 · 추천 ${result.suggested}건 · 미분류 ${result.unmatched}건`)
```

---

## Part 2. 미분류 항목 상세 패널 (Transaction Detail Panel) — 신규

### 2-1. 문제점

현재 미분류 수신함은 **그룹 단위(rawName 기준 집계)** 로만 표시됨.

```
현재 표시 정보:
  원본 내역(rawName) | 금액 | 유형 | 건수 | 총액 | 최신 발생일 | 분류 액션
```

**부족한 정보:**
- 같은 가맹점이라도 날짜별로 어떤 건들인지 볼 수 없음
- 실제 카드/계좌 중 어디서 결제됐는지 모름 (asset 정보 없음)
- 원본 raw 데이터(메모, 비고 등)를 볼 수 없음
- 여러 건 중 특정 건만 다르게 분류해야 할 때 방법 없음

---

### 2-2. 설계: 행 클릭 → Collapsible 인라인 패널

> **선택 이유:** 별도 모달보다 행 아래에 인라인으로 펼치는 방식이
> 테이블 컨텍스트를 유지하면서 상세 정보를 빠르게 확인할 수 있음.

```
[행 클릭 전]
┌────────────────────────────────────────────────────────────────┐
│ 스타벅스  │ 7,500원 │ 지출 │ 12건 │ 90,000원 │ 2026-03-10 │ [분류] │
└────────────────────────────────────────────────────────────────┘

[행 클릭 후 — 아래로 펼쳐짐]
┌────────────────────────────────────────────────────────────────┐
│ 스타벅스  │ 7,500원 │ 지출 │ 12건 │ 90,000원 │ 2026-03-10 │ [분류] │ ▲
├────────────────────────────────────────────────────────────────┤
│  날짜        │ 금액      │ 계좌/카드             │ 메모         │
│  2026-03-10  │ 7,500원   │ 쾅영 현대카드         │ -            │
│  2026-03-08  │ 7,500원   │ 광준 사업자 삼성카드  │ -            │
│  2026-03-05  │ 5,500원   │ 쾅영 현대카드         │ -            │
│  ...                                              (전체 12건)   │
└────────────────────────────────────────────────────────────────┘
```

---

### 2-3. 데이터 설계

**기존 `UnclassifiedGroup`에 `transactionIds`가 이미 있음** → 이것을 활용.

클릭 시 해당 `transactionIds`로 개별 거래 상세를 지연 로딩(lazy load):

```ts
// 신규 API: src/entities/transaction/api/get-transactions-by-ids.ts
export async function getTransactionsByIds(
  ids: string[]
): Promise<TransactionDetail[]>

interface TransactionDetail {
  id: string
  date: string
  amount: number
  description: string
  asset_name?: string    // 계좌/카드명 (assets JOIN)
  asset_owner?: string   // 광준 / 의영 / 공동
  receipt_memo?: string  // 메모/비고
  source_raw_data?: Record<string, unknown>  // 원본 raw 데이터 (JSONB)
}
```

---

### 2-4. UI 구현 (반응형 설계)

> **V2.0 보강:** Mobile_UX_Optimization.md와 통합하여 모든 디바이스에서 동일한 논리 구조를 유지하면서 렌더링만 변경합니다.

**파일 구조:**
```
src/features/refine-ledger/ui/
├── bulk-assigner.tsx               (기존, 변경 없음)
├── auto-apply-rules-button.tsx     (기존, 토스트만 수정)
├── unclassified-row.tsx            ← 신규 (행 + 반응형 상세 렌더링)
├── transaction-detail-panel.tsx    ← 신규 (인라인 패널 — 데스크톱/태블릿)
└── transaction-detail-sheet.tsx    ← 신규 (Bottom Sheet — 모바일)
```

**`unclassified-row.tsx` 구조 (반응형 분기):**
```tsx
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { TableRow, TableCell } from '@/shared/ui/table'
import { useMediaQuery } from '@/shared/hooks/use-media-query'
import { getTransactionsByIds } from '@/entities/transaction/api/get-transactions-by-ids'
import { TransactionDetailPanel } from './transaction-detail-panel'
import { TransactionDetailSheet } from './transaction-detail-sheet'

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
      {/* 기존 TableRow — 클릭 핸들러 추가 */}
      <TableRow
        onClick={handleRowClick}
        className="cursor-pointer hover:bg-muted/30 transition-colors"
      >
        {/* ... 기존 셀들 그대로 ... */}
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
        // 모바일: Bottom Sheet (절대 위치 오버레이)
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

**`transaction-detail-panel.tsx` 구조 (데스크톱/태블릿용 인라인):**
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

**`transaction-detail-sheet.tsx` 구조 (모바일용 Bottom Sheet):**

이 컴포넌트는 Mobile_UX_Optimization.md 2-1 섹션에서 정의한 구조를 따릅니다.
자세한 구현은 해당 문서를 참고하세요.

---

### 2-5. `page.tsx` 수정 범위

`groups.map()` 내부의 `<TableRow>` + `<BulkAssigner>`를 `<UnclassifiedRow>`로 교체.
나머지 데이터 로딩 로직은 변경 없음.

```tsx
// 변경 전
{groups.map((group) => (
  <TableRow key={...}>
    ...
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

---

## Part 3. 단건 추천 로직(suggestCategory) 정밀 개선 — 신규

### 3-1. 정밀 검토 결과 (Issue Report)

단건 추천 로직(`suggestCategory`) 분석 결과, 다음과 같은 예외 상황에서 매칭율이 저하될 수 있음을 확인했습니다.

| 항목 | 현황 | 문제점 | 개선안 |
|---|---|---|---|
| **대소문자** | `Exact`, `Contains` 모두 대소문자 구분함 | 'Starbucks'와 'STARBUCKS'를 다르게 인식 | 모든 비교를 `.toLowerCase()` 기반으로 수행 |
| **공백 처리** | 원본 `description`을 그대로 사용함 | ' 스타벅스 ' 처럼 공백 포함 시 매칭 실패 | 입력값과 키워드 모두 `.trim()` 처리 필수 |
| **우선순위** | `find()` 첫 번째 발견 항목에 의존 | `exact`가 `contains`보다 우선하지만, `contains` 간의 우선순위 미정의 | Exact → Contains 단계별 우선순위 보장 + Contains 내 priority 정렬 |

### 3-2. 개선된 단건 매칭 로직 (Pseudocode)

```ts
export async function suggestCategory(description: string) {
  const cleanDesc = description.trim().toLowerCase(); // 1. 전처리 (Trim + LowerCase)

  // 1단계: Exact Match (대소문자 무시)
  const exact = rules.find(r =>
    r.match_type === 'exact' &&
    r.keyword.trim().toLowerCase() === cleanDesc
  );
  if (exact) return { ...exact, confidence: 'high', rule_type: 'exact' };

  // 2단계: Contains Match (대소문자 무시, priority 순 정렬)
  const contains = rules
    .filter(r => r.match_type === 'contains')
    .sort((a, b) => a.priority - b.priority)
    .find(r => cleanDesc.includes(r.keyword.trim().toLowerCase()))

  if (contains) return { ...contains, confidence: 'medium', rule_type: 'keyword' };

  // 3단계: History Match (동일 가맹점 최빈값)
  // ... (기존 로직 유지하되 description 비교 시 TRIM 적용)
  // const history = await getHistoryMatch(cleanDesc)
  // if (history) return { ...history, confidence: 'low', rule_type: 'history' }

  return null
}
```

### 3-3. 구현 상세 (contains 우선순위 처리)

**현황 점검:**
```ts
// 기존 코드 (rules가 priority로 정렬되어 있는지 확인 필요)
const contains = rules.find(r =>
  r.match_type === 'contains' &&
  desc.includes(r.keyword)
)
```

**개선안 (명시적 정렬):**
```ts
// 개선된 코드
const contains = rules
  .filter(r => r.match_type === 'contains')  // step 1: contains만 추출
  .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))  // step 2: priority 정렬
  .find(r => cleanDesc.includes(r.keyword.trim().toLowerCase()))  // step 3: 첫 번째 일치
```

**이 변경의 효과:**
- contains 간 우선순위가 명확해짐 (예: 'Cafe' vs 'Coffee' 중 정렬 순서대로 매칭)
- priority 기반 매칭 순서 보장
- DB에서 priority를 제대로 정의했을 경우 의도대로 동작

### 3-4. History Match 개선 고려사항

History Match 로직에서도 description 비교 시 동일한 정규화 필요:

```ts
// 기존 (문제)
const history = historyMap.get(desc)  // 원본 desc 그대로 사용

// 개선 (검토 필요)
const cleanDesc = description.trim().toLowerCase()
const history = historyMap.get(cleanDesc)  // 정규화된 desc로 조회
// 또는
const history = Array.from(historyMap.entries())
  .find(([key]) => key.trim().toLowerCase() === cleanDesc)
```

**결정:** History 데이터 구조 결정 후 구현

---

## ✅ 전체 구현 체크리스트 (Antigravity용)

### Part 1: 성능 최적화
- [ ] `suggest-category-bulk.ts` 신규 생성 (벌크 로직)
- [ ] `apply-tagging-rules.ts` 수정 — `suggestCategory` 루프를 `suggestCategoryBulk` 단일 호출로 교체
- [ ] `auto-apply-rules-button.tsx` 수정 — 진행률 토스트 방법 A 적용
- [ ] `suggest-category.ts` 수정 — Part 3 대소문자/공백 처리 적용 (변경됨)
- [ ] 검증: 100건 처리 시 Supabase 쿼리 로그에서 5회 이하 확인

### Part 2: 미분류 상세 패널
- [ ] `get-transactions-by-ids.ts` 신규 API 생성 (assets JOIN 포함)
- [ ] `transaction-detail-panel.tsx` 신규 UI 컴포넌트 생성 (인라인 패널)
- [ ] `transaction-detail-sheet.tsx` 신규 UI 컴포넌트 생성 (모바일 시트) — Mobile_UX_Optimization 연계
- [ ] `unclassified-row.tsx` 신규 컴포넌트 생성 (행 + 반응형 상세 렌더링)
- [ ] `/transactions/unclassified/page.tsx` 수정 — `UnclassifiedRow` 교체
- [ ] 검증: 데스크톱 행 클릭 → 인라인 패널 펼침 확인
- [ ] 검증: 모바일 행 탭 → Bottom Sheet 오픈 확인
- [ ] 검증: 상세 정보에서 계좌/카드명, 날짜, 메모 정상 표시 확인

### Part 3: 단건 추천 로직 정밀 개선
- [ ] `suggest-category.ts` 수정 — `description.trim().toLowerCase()` 전처리 적용
- [ ] `suggest-category.ts` 수정 — Exact Match 시 `r.keyword.trim().toLowerCase()` 비교
- [ ] `suggest-category.ts` 수정 — Contains Match 시 `r.keyword.trim().toLowerCase()` 비교
- [ ] `suggest-category.ts` 검토 — History Match description 비교 시 trim 적용 여부 확인
- [ ] 검증: 'STARBUCKS', 'Starbucks', ' 스타벅스 ' 등 대소문자/공백 케이스 매칭 확인

---

---

## 🔗 관련 문서 및 통합 포인트

| 항목 | 문서 | 통합 내용 |
|------|------|---------|
| **모바일 UX** | `Mobile_UX_Optimization.md` | Part 2의 `TransactionDetailSheet` 컴포넌트 (모바일 Bottom Sheet) |
| **Sprint 2 설계** | `L_and_D_ERP_Sprint2_Design.md` | 스마트 태깅 Lite (S-1) 기능 |
| **구독 분리** | `L_and_D_ERP_Sprint2_Design.md` | `mdt_allocation_rules` 확장 (is_business, business_tag) |

---

## 💡 구현 참고 — 기존 재활용 포인트

| 신규 기능 | 재활용 가능한 기존 코드 |
|-----------|------------------------|
| `suggestCategoryBulk` | `suggestCategory`의 3단계 로직 그대로, 루프를 벌크로 변환 |
| `getTransactionsByIds` | 기존 `transactions` 쿼리 패턴 + `assets` JOIN 추가 |
| `UnclassifiedRow` | 기존 `TableRow` + `BulkAssigner` 조합을 컴포넌트로 분리 |
| 인라인 패널 토글 | `RecurringExpenseCalendar` 등의 useState 토글 패턴 참고 |
| 반응형 분기 | `Mobile_UX_Optimization.md`의 `useMediaQuery` 훅 사용 |
| Bottom Sheet | `Mobile_UX_Optimization.md` 2-1 섹션 참고 |

---

## 📝 V2.0 변경 요약

| 섹션 | V1.0 | V2.0 | 이유 |
|------|-----|-----|------|
| **Part 1** | 함수 분리 전략만 설명 | 4-Step 구체적 구현 추가 | 명확한 코드 패턴 제시 |
| **Part 2** | 데스크톱만 고려 | 반응형 설계 (모바일 시트 추가) | 모든 디바이스 지원 |
| **Part 3** | 개선안만 제시 | contains 우선순위 + History 고려사항 추가 | 완전한 구현 가이드 |
| **체크리스트** | Part 1-2만 정의 | Part 3 추가 + 모바일 컴포넌트 명시 | 전체 범위 명확화 |
