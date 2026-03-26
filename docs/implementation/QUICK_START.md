# 📌 Spring 1 + Smart Tagging + Mobile UX 구현 안내 (2026-03-11)

> **작성자:** Claude (설계 담당)
> **대상:** Antigravity (구현 담당)
> **상태:** 설계 완료 → 구현 시작 준비
> **마지막 업데이트:** 2026-03-11 (V1.0)

---

## 🎯 빠른 시작 가이드

### 1️⃣ 오늘 해야 할 일 (30분)

```
✅ DB 마이그레이션 검증
  → docs/handover/DB_MIGRATION_CHECKLIST_20260311.md 열기
  → Sprint 1 필수 컬럼 확인 (SQL 쿼리 복사-붙여넣기)
  → 결과 보고 (5개 컬럼이 모두 있는지 확인)

✅ 실행 로드맵 읽기
  → docs/handover/ANTIGRAVITY_EXECUTION_ROADMAP_20260311.md
  → "즉시 확인 항목" 섹션 읽기
  → 현재 구현 상태 확인
```

### 2️⃣ 설계 문서 (구현 전 필독)

| 순서 | 문서 | 읽는 시간 | 용도 |
|------|------|----------|------|
| 1️⃣ | `Smart_Tagging_Optimization.md` (V2.1) | 30분 | Part 1-3 구현 가이드 |
| 2️⃣ | `Mobile_UX_Optimization.md` (V1.1) | 20분 | 반응형 UI 설계 |
| 3️⃣ | `ANTIGRAVITY_EXECUTION_ROADMAP_20260311.md` | 15분 | 구현 순서 및 체크리스트 |

### 3️⃣ 구현 시작 순서

```
🔴 P0 (필수 — 먼저)
  1. Part 3 단건 로직 (1시간) → suggest-category.ts trim/toLowerCase
  2. Part 2 미분류 패널 (1.5일) → 상세 정보 표시
  3. Mobile UX 사이드바 (1.5일) → 반응형 레이아웃
  └─ 소계: 3일

🟡 P1 (권장 — 그 다음)
  4. Part 1 성능 최적화 (1일) → 벌크 쿼리
  └─ 소계: 1일

⭐ P2 (모바일 — 마지막)
  5. Mobile UX 행 인터랙션 (0.5일) → Bottom Sheet
  └─ 소계: 0.5일

⏳ 총 기간: 4.5일 (1주일 안에 완료 가능)
```

---

## 📂 문서 구조

```
docs/handover/  ← 지금 여기
├── README_20260311.md                          ← 이 파일
├── ANTIGRAVITY_EXECUTION_ROADMAP_20260311.md  ← 📍 구현 시작하기 전 필독
├── DB_MIGRATION_CHECKLIST_20260311.md          ← 📍 먼저 확인할 것
└── WORK_ORDER_ERP_PHASE4.md                    ← (Phase 4, 나중에)

docs/features/
├── Smart_Tagging_Optimization.md (V2.1)        ← Part 1-3 설계서
├── Mobile_UX_Optimization.md (V1.1)            ← 반응형 UI 설계서
├── REVIEW_SUMMARY_20260311.md                  ← 검토 내용 상세
└── (다른 설계 파일들)

docs/design/
└── L_and_D_ERP_Sprint2_Design.md (V1.0)        ← Sprint 2 (나중에)
```

---

## 🚀 즉시 실행 체크리스트

### Phase 0: 검증 (오늘, 30분)

- [ ] **DB 마이그레이션 확인**
  ```
  → DB_MIGRATION_CHECKLIST_20260311.md 열기
  → "Sprint 1 필수 컬럼" 섹션의 SQL 쿼리 5개 실행
  → 모두 "있음"이면 ✅ 통과
  ```

- [ ] **현재 구현 상태 파악**
  ```
  → ANTIGRAVITY_EXECUTION_ROADMAP_20260311.md 열기
  → "즉시 확인 항목" 섹션의 각 질문에 답변
  → 현재 어느 부분까지 구현됐나? 정확히 파악
  ```

- [ ] **필요 파일들 위치 확인**
  ```
  → src/features/refine-ledger/api/ 폴더 열기
  → suggest-category-bulk.ts 있나? (없으면 Part 1 필요)
  → src/features/refine-ledger/ui/ 폴더 열기
  → transaction-detail-panel.tsx 있나? (없으면 Part 2 필요)
  ```

### Phase 1: 설계 문서 읽기 (1시간)

- [ ] **Smart_Tagging_Optimization.md V2.1 읽기** (30분)
  - Part 1: 성능 최적화 (4-Step 구체화)
  - Part 2: 미분류 상세 패널 (반응형 설계)
  - Part 3: 단건 로직 (trim/toLowerCase)

- [ ] **Mobile_UX_Optimization.md V1.1 읽기** (20분)
  - 1-2: 행 인터랙션 패턴 (Smart Tagging 통합)
  - 1-3: useMediaQuery 훅 + SidebarProvider
  - MVP 체크리스트 복사

- [ ] **ANTIGRAVITY_EXECUTION_ROADMAP_20260311.md 읽기** (10분)
  - "구현 순서" 섹션
  - 각 파트별 체크리스트

### Phase 2: 구현 준비 (30분)

- [ ] **Branch 생성**
  ```bash
  git checkout main
  git pull
  git checkout -b feat/smart-tagging-mobile-ux-20260311
  ```

- [ ] **구현 파일 구조 미리 만들기** (Optional)
  ```bash
  # Part 3 (suggest-category.ts 수정)
  # Part 2 (신규 파일들)
  touch src/entities/transaction/api/get-transactions-by-ids.ts
  touch src/features/refine-ledger/ui/transaction-detail-panel.tsx
  touch src/features/refine-ledger/ui/transaction-detail-sheet.tsx
  touch src/features/refine-ledger/ui/unclassified-row.tsx

  # Mobile UX (신규 파일들)
  touch src/shared/hooks/use-media-query.ts
  touch src/shared/ui/sidebar/sidebar-provider.tsx
  touch src/shared/ui/header/mobile-menu-button.tsx
  ```

---

## 📋 구현 순서별 체크리스트

### ✅ Part 3: 단건 로직 개선 (1시간)

**파일:** `src/features/refine-ledger/api/suggest-category.ts`

체크리스트:
```
[ ] description.trim().toLowerCase() 전처리 추가
[ ] Exact Match: r.keyword.trim().toLowerCase() 비교
[ ] Contains Match: 필터 → 정렬 → find() 적용
[ ] History Match: trim() 적용 여부 검토

[ ] 테스트
    [ ] 'STARBUCKS' 매칭되나?
    [ ] ' 스타벅스 ' 공백 제거 후 매칭되나?
    [ ] 'Cafe' vs 'Coffee'에서 priority 순 일치하나?

[ ] PR 올리기 (Part 3만 먼저)
```

**참고:** Smart_Tagging_Optimization.md Part 3-2, 3-3 섹션의 코드 예시

---

### ✅ Part 2: 미분류 상세 패널 (1.5일)

**4개 파일 신규 생성:**

1️⃣ **`get-transactions-by-ids.ts`** (API)
```
위치: src/entities/transaction/api/
목적: Transaction ID 배열로 상세 정보 조회
반환: TransactionDetail[] (date, amount, asset_name, owner, memo)
참고: Smart_Tagging_Optimization.md 2-3절의 인터페이스 정의
```

체크리스트:
```
[ ] 함수 서명 정확한가?
    export async function getTransactionsByIds(ids: string[]): Promise<TransactionDetail[]>

[ ] transactions ← assets JOIN 있나?

[ ] 필요 필드 모두 있나?
    [ ] date
    [ ] amount
    [ ] asset_name (assets.name)
    [ ] asset_owner (assets.owner_type)
    [ ] receipt_memo
```

2️⃣ **`transaction-detail-panel.tsx`** (인라인 UI)
```
위치: src/features/refine-ledger/ui/
목적: 데스크톱/태블릿에서 인라인 펼쳐지는 상세 정보 테이블
참고: Smart_Tagging_Optimization.md 2-4절의 코드
```

3️⃣ **`transaction-detail-sheet.tsx`** (모바일 UI)
```
위치: src/features/refine-ledger/ui/
목적: 모바일에서 Bottom Sheet로 표시되는 상세 정보
참고: Mobile_UX_Optimization.md 2-1절의 코드
```

4️⃣ **`unclassified-row.tsx`** (통합 행)
```
위치: src/features/refine-ledger/ui/
목적: 행 렌더링 + 반응형 상세 패널 분기
분기: isMobile ? TransactionDetailSheet : 인라인 패널
참고: Smart_Tagging_Optimization.md 2-4절 + Mobile_UX_Optimization.md 2-1절
```

5️⃣ **`/transactions/unclassified/page.tsx` 수정**
```
변경: groups.map() → <TableRow> + <BulkAssigner>
     → <UnclassifiedRow> 교체
```

체크리스트:
```
[ ] 4개 파일 모두 생성됨
[ ] /transactions/unclassified/page.tsx에서 UnclassifiedRow import
[ ] 데스크톱에서 행 클릭 → 인라인 펼침
[ ] 모바일에서 행 탭 → Bottom Sheet 오픈
[ ] 상세 정보 정상 표시
[ ] PR 올리기
```

---

### ✅ Mobile UX: 사이드바 반응형 (1.5일)

**5개 파일 신규 + 수정:**

1️⃣ **`use-media-query.ts`** (신규 훅)
```
위치: src/shared/hooks/
참고: Mobile_UX_Optimization.md 1-3절
```

2️⃣ **`sidebar-provider.tsx`** (신규 Provider)
```
위치: src/shared/ui/sidebar/
참고: Mobile_UX_Optimization.md 1-2절 Step 1
```

3️⃣ **`mobile-menu-button.tsx`** (신규 컴포넌트)
```
위치: src/shared/ui/header/
목적: 모바일/태블릿 메뉴 토글 버튼
```

4️⃣ **`header.tsx` 수정**
```
위치: src/shared/ui/header/
변경: MobileMenuButton import + useSidebar() 사용
참고: Mobile_UX_Optimization.md 1-2절 Step 2
```

5️⃣ **`sidebar.tsx` 수정**
```
위치: src/shared/ui/sidebar/
변경: useSidebar() + useMediaQuery() 조합
       → isMobile / isTablet / isDesktop 분기
참고: Mobile_UX_Optimization.md 1-2절 Step 3
```

6️⃣ **`(dashboard)/layout.tsx` 수정**
```
위치: src/app/(dashboard)/
변경: grid-cols 동적 조정 (isCollapsed 기반)
참고: Mobile_UX_Optimization.md 1-2절 Step 4
```

체크리스트:
```
[ ] 5개 파일 완료
[ ] SidebarProvider를 app/layout.tsx에서 래핑
[ ] 1024px+: 사이드바 w-64 고정
[ ] 768~1023px: w-16 (아이콘) ↔ w-64 (펼침) 토글
[ ] <768px: 숨김 ↔ Slide-over 토글
[ ] PR 올리기
```

---

### ✅ Part 1: 성능 최적화 (1일)

**2개 파일 신규 + 수정:**

1️⃣ **`suggest-category-bulk.ts`** (신규)
```
위치: src/features/refine-ledger/api/
목적: 벌크 매칭 (202+N 쿼리 → 5회 고정)
참고: Smart_Tagging_Optimization.md 1-3절
```

체크리스트:
```
[ ] 4-Step 구현 (rules 로드 → history 집계 → 인메모리 매칭 → 벌크 upsert)
[ ] 테스트: 100건 처리 시 DB 쿼리 5회 이하?
[ ] PR 올리기
```

2️⃣ **`apply-tagging-rules.ts` 수정**
```
변경: suggestCategory() 루프 → suggestCategoryBulk() 호출
참고: Smart_Tagging_Optimization.md 1-4절
```

3️⃣ **`auto-apply-rules-button.tsx` 수정**
```
변경: 진행률 스트리밍 제거 → 토스트 방법 A (완료 후 한 번)
참고: Smart_Tagging_Optimization.md 1-5절
```

---

### ✅ Mobile UX: 행 인터랙션 (0.5일)

**unclassified-row.tsx에 이미 반응형 로직이 있으니, 모바일 전용 Sheet만 추가:**

```
[ ] transaction-detail-sheet.tsx 확인 (Part 2에서 이미 생성됨)
[ ] unclassified-row.tsx의 isMobile 분기 로직 작동 확인
[ ] <768px에서 행 클릭 → Bottom Sheet 오픈
[ ] PR 올리기
```

---

## 📞 막혔을 때

### 1. 타입 에러

```
"TransactionDetail이 뭔가요?"

→ Smart_Tagging_Optimization.md 2-3절에 정의되어 있음
→ 복사-붙여넣기
```

### 2. DB 쿼리 모르겠을 때

```
"getTransactionsByIds에서 JOIN 쿼리 어떻게 쓰지?"

→ 기존 get-unclassified.ts의 쿼리 패턴 참고
→ assets 테이블 추가 (LEFT JOIN)
→ 막히면 CLAUDE에 물어보기
```

### 3. 성능이 나쁠 때

```
"Part 1 후에도 쿼리가 많아요"

→ 마이그레이션 검증: priority, match_type 컬럼 정말 있나?
→ suggestCategoryBulk의 4-Step 제대로 따랐나?
→ CLAUDE에 상황 보고 (쿼리 로그 첨부하면 좋음)
```

### 4. 반응형이 안 될 때

```
"모바일에서 사이드바 토글이 안 돼요"

→ useMediaQuery('<768px') 반환값 console.log로 확인
→ SidebarProvider가 app/layout.tsx에서 래핑되었나?
→ 브라우저 DevTools → Device 모드 768px 이하로 테스트
```

---

## ✨ 마지막 조언

1. **부분부분 진행**
   - 파트 하나 완료 → PR → 피드백 → 다음 파트
   - 한 번에 다 하려고 하면 복잡함

2. **테스트 먼저**
   - 각 파트 완료 후 즉시 수동 테스트
   - UI가 의도대로 움직이는지 확인

3. **문서 참고**
   - 헷갈릴 때 설계 문서 다시 읽기
   - 코드 예시가 있으니 복사-붙여넣기 OK

4. **막혔으면 바로 물어보기**
   - "이거 모르는데" → CLAUDE가 도와줌
   - 아무것도 이상한 게 없으면 진행이 부자연스럼

5. **커밋 메시지**
   ```
   Part 3: Smart Tagging 단건 로직 개선 (trim/toLowerCase)
   Part 2: 미분류 상세 패널 신규 구현
   Mobile UX: 반응형 사이드바 구현
   Part 1: N+1 쿼리 최적화 (벌크 처리)
   ```

---

## 🎯 성공 기준

### 구현 완료

```
✅ Smart Tagging Part 1-3 모두 작동
   └─ 쿼리: 5회 이하, 대소문자/공백 매칭 정상

✅ 미분류 상세 패널 작동
   └─ 데스크톱: 인라인, 모바일: 시트

✅ 반응형 UI 작동
   └─ 768px, 1024px 브레이크포인트 정상 동작

✅ 모바일 테스트 완료
   └─ iOS Safari, Android Chrome에서 UI 정상
```

### 테스트 케이스

```
[ ] 자동 분류 100건 처리 → 쿼리 5회 확인
[ ] 미분류 항목 행 클릭 → 상세 정보 표시
[ ] 모바일 768px에서 메뉴 토글 → Slide-over 열림
[ ] Bottom Sheet에서 닫기 버튼 → 닫힘
[ ] 'STARBUCKS' + 'starbucks' + ' 스타벅스 ' → 모두 매칭됨
[ ] priority 낮은 rules부터 적용됨
```

---

## 📚 참고 자료 (다시 한번)

| 문서 | 위치 | 용도 |
|------|------|------|
| **Smart Tagging 설계서** | `docs/features/Smart_Tagging_Optimization.md` | Part 1-3 상세 설계 + 코드 |
| **Mobile UX 설계서** | `docs/features/Mobile_UX_Optimization.md` | 반응형 설계 + 코드 |
| **실행 로드맵** | `docs/handover/ANTIGRAVITY_EXECUTION_ROADMAP_20260311.md` | 순서 + 체크리스트 |
| **DB 검증** | `docs/handover/DB_MIGRATION_CHECKLIST_20260311.md` | 마이그레이션 확인 |
| **검토 요약** | `docs/features/REVIEW_SUMMARY_20260311.md` | 전체 검토 내용 |

---

## 🚀 지금 바로

1. **`DB_MIGRATION_CHECKLIST_20260311.md` 열기**
   → Sprint 1 필수 컬럼 5개 SQL 쿼리 실행 (10분)

2. **`ANTIGRAVITY_EXECUTION_ROADMAP_20260311.md` 읽기**
   → 구현 순서 및 체크리스트 확인 (10분)

3. **`Smart_Tagging_Optimization.md` 정독**
   → Part 1-3 설계 이해 (30분)

4. **Part 3부터 구현 시작**
   → suggest-category.ts 수정 (1시간)

**화이팅! 🎉**
