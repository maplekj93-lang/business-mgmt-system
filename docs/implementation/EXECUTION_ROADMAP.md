# 🚀 Antigravity 실행 로드맵 (2026-03-11)

> **대상:** Antigravity (AI Fair Programmer)
> **목적:** Sprint 1 + Smart Tagging + Mobile UX 통합 구현의 구체적 실행 순서 정의
> **상태:** 설계 완료 → 구현 시작 준비

---

## 📊 현재 상황 정리

### ✅ 설계 문서 (모두 완료됨)

| 문서 | 버전 | 상태 | 범위 |
|------|------|------|------|
| `Smart_Tagging_Optimization.md` | V2.1 | ✅ 완료 | Sprint 1 최적화 (Part 1-3) |
| `Mobile_UX_Optimization.md` | V1.1 | ✅ 완료 | 반응형 UX (모든 Sprint) |
| `L_and_D_ERP_Sprint2_Design.md` | V1.0 | ✅ 완료 | Sprint 2 신규 기능 (4개) |
| `REVIEW_SUMMARY_20260311.md` | V1.0 | ✅ 완료 | 검토 및 통합 분석 |

### ⏳ 구현 진행 중

**안티그래비티의 현재 상태 확인 필요:**
```
❓ Sprint 1 어디까지 구현됐나?
❓ DB 마이그레이션은?
❓ Part 3 단건 로직도 구현했나?
```

---

## 🎯 즉시 확인 항목 (오늘)

### 1️⃣ Sprint 1 구현 진행률 체크

```markdown
## Sprint 1 구현 현황

### Part 1: 성능 최적화 (Smart Tagging)

**파일 생성 확인:**
- [ ] `src/features/refine-ledger/api/suggest-category-bulk.ts` 있나?
  └─ 없으면 → Part 1-3에서 구현 필요
- [ ] `src/features/refine-ledger/api/apply-tagging-rules.ts` 수정됐나?
  └─ 확인: suggestCategory 루프가 suggestCategoryBulk 단일 호출로 변경됐는지

**테스트:**
- [ ] 100건 자동 분류 시 Supabase 쿼리 몇 개?
  - 목표: 5회 (1회는 user 조회 + 1회 트랜잭션 + 1회 rules + 1회 history + 1회 update)
  - 현재 수치를 알려주면 성능 개선 여부 확인 가능

### Part 2: 미분류 상세 패널

**파일 생성 확인:**
- [ ] `src/entities/transaction/api/get-transactions-by-ids.ts` 있나?
- [ ] `src/features/refine-ledger/ui/transaction-detail-panel.tsx` 있나?
- [ ] `src/features/refine-ledger/ui/unclassified-row.tsx` 있나?

**테스트:**
- [ ] 미분류 페이지에서 행 클릭 시 상세 정보 펼쳐지나?
- [ ] 계좌/카드명, 날짜, 메모 정상 표시되나?

### Part 3: 단건 로직 개선

**코드 수정 확인:**
```ts
// suggest-category.ts에 다음이 있나?
const cleanDesc = description.trim().toLowerCase()
```

**테스트:**
- [ ] 'STARBUCKS', 'starbucks', ' 스타벅스 ' 모두 매칭되나?
- [ ] 'Cafe' vs 'Coffee' 중 priority 순서대로 매칭되나?

---

## 🔌 DB 마이그레이션 상태 확인

### Sprint 2 준비용 (이미 필요한 컬럼들)

Supabase → SQL Editor에서 다음을 확인:

```sql
-- 1. mdt_allocation_rules 테이블 확인
SELECT column_name FROM information_schema.columns
WHERE table_name = 'mdt_allocation_rules';

-- 필요 컬럼 (있는지 확인):
-- - is_business
-- - business_tag
-- - match_type
-- - priority

-- 2. transactions 테이블 확인
SELECT column_name FROM information_schema.columns
WHERE table_name = 'transactions';

-- 필요 컬럼:
-- - excluded_from_personal

-- 3. projects 테이블 확인
SELECT column_name FROM information_schema.columns
WHERE table_name = 'projects';

-- 필요 컬럼:
-- - invoice_sent_date
-- - expected_payment_date
-- - actual_payment_date
```

**결과 보고:**
- ✅ 모두 있음 → Sprint 2 바로 시작 가능
- ❌ 일부 없음 → `20260311_sprint2_tagging_and_tracking.sql` 마이그레이션 실행 필요

---

## 🔌 Mobile UX 구현 상태

### 현재 레이아웃 구조 확인

```bash
# src/shared/ui/sidebar 폴더가 있나?
ls -la src/shared/ui/sidebar/

# src/shared/hooks 폴더가 있나?
ls -la src/shared/hooks/
```

**필요 파일들 (구현 필요):**
- [ ] `src/shared/hooks/use-media-query.ts` (신규)
- [ ] `src/shared/ui/sidebar/sidebar-provider.tsx` (신규)
- [ ] `src/shared/ui/header/mobile-menu-button.tsx` (신규)
```

---

## 📋 구현 순서 (우선순위)

### **Phase 1: Sprint 1 마무리 (3-4일)**

#### 우선순위 1️⃣ (필수)
```
✅ Part 3: 단건 로직 개선 (1시간)
  └─ suggest-category.ts에 trim().toLowerCase() 적용
  └─ 테스트: 'STARBUCKS' 등 대소문자 케이스 확인

✅ Part 2: 미분류 상세 패널 (1.5일)
  ├─ get-transactions-by-ids.ts (API)
  ├─ transaction-detail-panel.tsx (인라인 UI)
  ├─ unclassified-row.tsx (반응형 행)
  └─ /transactions/unclassified/page.tsx (통합)
  └─ 테스트: 행 클릭 → 상세 정보 표시 확인

✅ Mobile UX - 사이드바 (1.5일)
  ├─ use-media-query.ts (훅)
  ├─ sidebar-provider.tsx (전역 상태)
  ├─ header.tsx 수정 (토글 버튼)
  ├─ sidebar.tsx 수정 (반응형)
  └─ (dashboard)/layout.tsx 수정 (grid 조정)
  └─ 테스트: 768px, 1024px에서 UI 변경 확인
```

#### 우선순위 2️⃣ (권장)
```
⭐ Part 1: 성능 최적화 (1일)
  └─ suggest-category-bulk.ts (벌크 로직)
  └─ apply-tagging-rules.ts 수정
  └─ 테스트: 쿼리 수 5회 이하 확인
```

#### 우선순위 3️⃣ (모바일)
```
⭐ Mobile UX - 행 인터랙션 (0.5일)
  ├─ transaction-detail-sheet.tsx (모바일 시트)
  └─ unclassified-row.tsx 수정 (반응형 분기)
  └─ 테스트: 모바일에서 Bottom Sheet 표시 확인
```

### **Phase 2: Sprint 2 시작 (언제?)**

```
⏳ DB 마이그레이션 검증 및 실행
⏳ 4개 기능 순차 구현
  ├─ M-3: 이중 지출 차단 (1일)
  ├─ S-7: 구독 사업비 분리 (0.5일)
  ├─ S-1: 스마트 태깅 Lite (2일, Part 1-3과 통합)
  └─ S-2: 입금 지연 추적 (1일)
```

---

## 📍 구현 체크리스트 (사본)

### Part 1: 성능 최적화

```
[ ] `suggest-category-bulk.ts` 신규 생성
    - 단계: rules 로드 → history 벌크 집계 → 인메모리 매칭 → 벌크 upsert
    - 목표 쿼리: 1회 (rules) + 1회 (history) + 1회 (upsert)

[ ] `apply-tagging-rules.ts` 수정
    - suggestCategory() 루프 → suggestCategoryBulk() 단일 호출로 교체
    - 반환값 구조 그대로 유지

[ ] `auto-apply-rules-button.tsx` 수정
    - 진행률 스트리밍 제거
    - 토스트: "✅ 자동 적용 ${result.auto_applied}건 ..."

[ ] 검증
    - 100건 처리 시 DB 쿼리 총 5회 이하?
    - Supabase 로그 → Executions 탭에서 확인
```

### Part 2: 미분류 상세 패널

```
[ ] `get-transactions-by-ids.ts` 신규 생성
    - 파라미터: string[] (transaction IDs)
    - 반환: TransactionDetail[] (date, amount, asset_name, asset_owner, receipt_memo)
    - JOIN: transactions ← assets
    - 참고: 기존 get-unclassified.ts 쿼리 패턴 재활용

[ ] `transaction-detail-panel.tsx` 신규 생성
    - 목적: 데스크톱/태블릿 인라인 패널
    - 렌더링: 테이블 형식 (날짜, 금액, 계좌/카드, 메모)
    - 로딩 상태: "로딩 중..." 표시

[ ] `unclassified-row.tsx` 신규 생성
    - 기존 TableRow 렌더링 + 클릭 핸들러
    - useMediaQuery('(max-width: 767px)') 분기
    - 모바일: TransactionDetailSheet 렌더링
    - 데스크톱/태블릿: 인라인 TableRow 펼침
    - 참고: REVIEW_SUMMARY_20260311.md의 코드 예시

[ ] `/transactions/unclassified/page.tsx` 수정
    - groups.map() 내부: TableRow + BulkAssigner → UnclassifiedRow로 교체
    - 데이터 로딩 로직 변경 없음

[ ] 검증
    - 데스크톱: 행 클릭 → 인라인 패널 펼침 ✓
    - 모바일: 행 탭 → Bottom Sheet 오픈 ✓
    - 상세 정보: 계좌/카드명, 날짜, 메모 정상 ✓
```

### Part 3: 단건 로직 개선

```
[ ] `suggest-category.ts` 수정
    - Step 1: const cleanDesc = description.trim().toLowerCase()
    - Step 2: Exact Match에서 r.keyword.trim().toLowerCase() 비교
    - Step 3: Contains Match 필터 후 priority 정렬 + find()
    - Step 4: History Match에도 trim() 적용 검토

[ ] 검증
    - 'STARBUCKS' → 'starbucks' 매칭 ✓
    - ' 스타벅스 ' → '스타벅스' 매칭 ✓
    - 'Cafe' vs 'Coffee'에서 priority 순 일치 ✓
```

### Mobile UX: 사이드바 반응형

```
[ ] `use-media-query.ts` 생성
    - useEffect + window.matchMedia 구현
    - 리스너 add/remove 처리

[ ] `sidebar-provider.tsx` 생성
    - React Context + useState (isOpen)
    - useSidebar() 훅 export
    - toggle() 함수 (모바일/태블릿만)

[ ] `header.tsx` 수정
    - MobileMenuButton import
    - useSidebar() 사용
    - onClick={toggle}

[ ] `sidebar.tsx` 수정
    - useSidebar() + useMediaQuery() 조합
    - isMobile: Slide-over 또는 null
    - isTablet: 아이콘만 또는 펼침
    - 데스크톱: 기본 펼침

[ ] `(dashboard)/layout.tsx` 수정
    - grid-cols 동적 조정 (isCollapsed 기반)
    - transition-all duration-300

[ ] 검증
    - 1024px+: 사이드바 w-64 ✓
    - 768~1023px: w-16 또는 w-64 토글 ✓
    - <768px: 숨김 또는 Slide-over ✓
```

### Mobile UX: 행 인터랙션

```
[ ] `transaction-detail-sheet.tsx` 생성
    - Bottom Sheet 오버레이 (모바일만)
    - 배경 클릭 시 닫기
    - 아이템별 상세 정보 (간단한 레이아웃)

[ ] `unclassified-row.tsx` 수정
    - isMobile ? TransactionDetailSheet : 인라인 패널
    - isLoading 상태 관리

[ ] 검증
    - 데스크톱 <768px: 인라인 X, Sheet O ✓
    - 데스크톱 ≥768px: 인라인 O, Sheet X ✓
```

---

## 🔄 진행 상황 보고 형식

구현 진행 시 다음 형식으로 진행 상황을 보고해주세요:

```markdown
## 진행 상황 보고 (2026-03-XX)

### Part 3 (단건 로직 개선)
- [x] suggest-category.ts 수정 (완료)
- [x] 검증: 대소문자/공백 테스트 완료
- 결과: ✅ PASS (3개 케이스 모두 일치)

### Part 2 (미분류 상세 패널)
- [x] get-transactions-by-ids.ts 완료
- [x] transaction-detail-panel.tsx 완료
- [ ] unclassified-row.tsx 진행 중 (50%)
- [ ] /transactions/unclassified/page.tsx 대기

### Part 1 (성능 최적화)
- [ ] suggest-category-bulk.ts 대기
- [ ] apply-tagging-rules.ts 대기

### Mobile UX
- [ ] use-media-query.ts 대기
- [ ] sidebar-provider.tsx 대기
```

---

## ❓ 추가 결정 필요 사항

### 1. Phase 2는 언제 시작?

```
옵션 A: Sprint 1 완료 후 바로 시작 (권장)
  └─ Sprint 1 + 2 연속 구현 (2주 정도)

옵션 B: Sprint 1 안정화 후 1주 쉬고 시작
  └─ 피드백 수집 → 개선 → Sprint 2 시작

옵션 C: Sprint 2는 나중에 (향후 계획)
  └─ 현재는 Sprint 1만 완료
```

### 2. Phase 4 (기업 ERP)는?

```
현재 WORK_ORDER_ERP_PHASE4.md는 **장기 계획** 수준입니다.
- 신규 테이블 10개+
- 신규 페이지 20개+
- 기간: 2-3주+

결정 필요:
  - 당장 안 할 계획? → 보류
  - Sprint 3으로 포함? → 스코프 확정 필요
```

---

## 📞 질문 & 피드백 채널

구현 중 다음 상황이 생기면 바로 알려주세요:

1. **DB 스키마 문제**
   - "mdt_allocation_rules에 priority 컬럼이 없어요"
   - → CLAUDE가 마이그레이션 SQL 작성

2. **타입 에러**
   - "TransactionDetail 타입을 모르겠어요"
   - → CLAUDE가 타입 정의 제공

3. **성능 이슈**
   - "Part 1 후에도 쿼리가 50회네요"
   - → CLAUDE가 최적화 방안 분석

4. **테스트 실패**
   - "Part 3 trim() 적용 후 매칭이 안 돼요"
   - → CLAUDE가 디버깅

---

## 🎁 제공되는 문서들

모두 `/docs/features/` 폴더에 있습니다:

1. **Smart_Tagging_Optimization.md (V2.1)**
   - Part 1-3 전체 설계 + 코드 예시

2. **Mobile_UX_Optimization.md (V1.1)**
   - Sidebar + 행 인터랙션 설계 + 구현 코드

3. **REVIEW_SUMMARY_20260311.md**
   - 검토 결과 + 통합 포인트

4. **이 파일 (ANTIGRAVITY_EXECUTION_ROADMAP_20260311.md)**
   - 실행 순서 + 체크리스트

---

## ✨ 마지막 조언

- **부분부분 커밋하기:** 파트 단위로 PR/커밋 → 피드백 빠름
- **테스트 먼저:** 각 파트 완료 후 즉시 검증
- **막히면 물어보기:** "이거 모르는데" → CLAUDE가 도와줌
- **문서 참고:** 헷갈릴 때 설계 문서 다시 읽기

**화이팅! 🚀**
