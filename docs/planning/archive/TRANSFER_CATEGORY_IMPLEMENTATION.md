# 🔄 Transfer 카테고리 및 자동분류 규칙 구현 가이드

**최종 승인:** 2026-03-05
**담당자:** Antigravity
**상태:** 👉 Implementation Ready

---

## 📋 개요

미분류된 2026 거래 450건을 정리하기 위해 다음 3가지를 구현:
1. **Transfer 타입 카테고리 추가** - 카드값, 계좌이동, 학자금 상환
2. **BulkAssigner UI 업그레이드** - 3번째 섹션 "🔄 이체/내부거래" 추가
3. **자동분류 키워드 규칙 대량 적용** - 150-200건 자동 분류

예상 결과: 미분류 450건 → 250건으로 축소

---

## 🎯 Phase 1: Database - Transfer 카테고리 추가

### 1-1. Migration: Transfer 타입 카테고리 생성

**파일:** `supabase/migrations/20260305_add_transfer_categories.sql`

```sql
-- Phase 1: Transfer 타입 메인 카테고리 추가
INSERT INTO mdt_categories (name, type, parent_id) VALUES
  ('🔄 이체 / 내부거래', 'transfer', NULL)
RETURNING id;

-- 위의 ID를 {TRANSFER_MAIN_ID}로 사용 (보통 120)
-- 이후 서브카테고리들을 추가:

-- Phase 2: Transfer 서브카테고리들
INSERT INTO mdt_categories (name, type, parent_id) VALUES
  ('카드대금 결제', 'transfer', {TRANSFER_MAIN_ID}),
  ('내부 이체', 'transfer', {TRANSFER_MAIN_ID}),
  ('저축 불입', 'transfer', {TRANSFER_MAIN_ID}),
  ('학자금 상환', 'transfer', {TRANSFER_MAIN_ID})
RETURNING id;

-- 위의 4개 ID가 나옴:
-- - 카드대금 결제: {CARD_PAYMENT_ID}
-- - 내부 이체: {INTERNAL_TRANSFER_ID}
-- - 저축 불입: {SAVINGS_ID}
-- - 학자금 상환: {STUDENT_LOAN_ID}
```

**주의:** INSERT 후 반환된 ID들을 다음 단계에서 사용. 각 ID를 메모해두세요.

### 1-2. 검증 쿼리

```sql
-- 새 카테고리가 제대로 추가됐는지 확인
SELECT id, name, type, parent_id
FROM mdt_categories
WHERE type = 'transfer'
ORDER BY parent_id NULLS FIRST, id;

-- 응답:
-- id=120, name=🔄 이체 / 내부거래, type=transfer, parent_id=NULL
-- id=121, name=카드대금 결제, type=transfer, parent_id=120
-- id=122, name=내부 이체, type=transfer, parent_id=120
-- id=123, name=저축 불입, type=transfer, parent_id=120
-- id=124, name=학자금 상환, type=transfer, parent_id=120
```

---

## 🎨 Phase 2: Frontend - BulkAssigner UI 업그레이드

### 2-1. 파일 수정

**파일:** `src/features/refine-ledger/ui/bulk-assigner.tsx`

현재 코드 (line 183-210)를 찾아서, Expense 섹션 다음에 Transfer 섹션을 추가:

```typescript
// === AFTER Expense Categories (line 210 다음에 추가) ===

{/* Transfer Categories */}
{categories.filter(g => g.main.type === 'transfer').length > 0 && (
  <div className="px-2 py-1.5 text-[10px] font-bold text-amber-600 uppercase bg-amber-500/5 mt-2">
    🔄 이체 / 내부거래 (Transfer)
  </div>
)}
{categories.filter(g => g.main.type === 'transfer').map((catGroup) => (
  <CommandGroup key={catGroup.main.id} heading={catGroup.main.name}>
    <CommandItem
      key={catGroup.main.id}
      value={catGroup.main.name}
      onSelect={() => onSelectCategory(catGroup.main.id, catGroup.main.name)}
      className="font-bold text-amber-600/80"
    >
      <Check className="mr-2 h-3 w-3 opacity-0" />
      {catGroup.main.name} (전체)
    </CommandItem>
    {catGroup.subs.map((sub) => (
      <CommandItem
        key={sub.id}
        value={`${catGroup.main.name} ${sub.name}`}
        onSelect={() => onSelectCategory(sub.id, `${catGroup.main.name} > ${sub.name}`)}
        className="pl-6 text-xs"
      >
        <span className="opacity-30 mr-2">└</span>
        {sub.name}
      </CommandItem>
    ))}
  </CommandGroup>
))}
```

### 2-2. 검증

- BulkAssigner 팝오버를 열면 3개 섹션 보여야 함:
  1. 💰 수입 카테고리 (Income)
  2. 💸 지출 카테고리 (Expense)
  3. 🔄 이체 / 내부거래 (Transfer) ← NEW

---

## 🤖 Phase 3: Keyword Rules - 자동분류 규칙 적용

### 3-1. 사전 작업: User ID 확인

```sql
-- Supabase auth.users 테이블에서 사용자 ID 확인
SELECT id, email FROM auth.users LIMIT 1;

-- 응답 예: id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
-- 이것을 {USER_ID}로 사용
```

### 3-2. Migration: 키워드 규칙 및 거래 자동분류

**파일:** `supabase/migrations/20260305_apply_keyword_rules_and_classify.sql`

```sql
-- ========================================
-- 키워드 규칙 정의 및 자동분류 스크립트
-- ========================================
-- 주의: {USER_ID}를 실제 사용자 ID로 교체하세요

DO $$
DECLARE
  v_user_id UUID := '{USER_ID}'::UUID;
  v_card_payment_id INT := 121;  -- 카드대금 결제
  v_internal_transfer_id INT := 122;  -- 내부 이체
  v_student_loan_id INT := 124;  -- 학자금 상환
  v_convenience_id INT := 19;  -- 식비 > 편의점
  v_life_insurance_id INT := 37;  -- 보험료 > 생명보험
  v_pension_id INT := 39;  -- 보험료 > 국민연금
  v_interest_id INT := 119;  -- 금융소득 > 이자소득
  v_tax_other_id INT := 87;  -- 세금 > 기타세금
  v_fuel_id INT := 30;  -- 교통비 > 주유비
BEGIN

-- ========== 1. 키워드 규칙 삽입 ==========
INSERT INTO mdt_allocation_rules (user_id, keyword, category_id)
VALUES
  -- 카드 결제들
  (v_user_id, '삼성카드결제', v_card_payment_id),
  (v_user_id, '삼성카드', v_card_payment_id),
  (v_user_id, '현대카드결제', v_card_payment_id),
  (v_user_id, '현대카드', v_card_payment_id),
  (v_user_id, '비씨카드', v_card_payment_id),
  (v_user_id, 'BC카드', v_card_payment_id),

  -- 계좌 이체
  (v_user_id, '우리은행', v_internal_transfer_id),
  (v_user_id, '국민은행', v_internal_transfer_id),
  (v_user_id, '기업은행', v_internal_transfer_id),
  (v_user_id, '카뱅', v_internal_transfer_id),

  -- 학자금
  (v_user_id, '한국장학재단', v_student_loan_id),

  -- 편의점
  (v_user_id, 'GS25', v_convenience_id),
  (v_user_id, 'CU', v_convenience_id),
  (v_user_id, '세븐일레븐', v_convenience_id),
  (v_user_id, '미니스톱', v_convenience_id),
  (v_user_id, 'GS칼텍스', v_fuel_id),

  -- 보험
  (v_user_id, 'KB생', v_life_insurance_id),
  (v_user_id, '국민연금', v_pension_id),

  -- 금융
  (v_user_id, '입출금통장 이자', v_interest_id),

  -- 세금
  (v_user_id, '국세청', v_tax_other_id),
  (v_user_id, '세무서', v_tax_other_id),
  (v_user_id, '종소세', v_tax_other_id)
ON CONFLICT (user_id, keyword) DO UPDATE
SET category_id = EXCLUDED.category_id;

-- ========== 2. 기존 미분류 거래에 자동분류 적용 ==========
-- 카드 결제
UPDATE transactions
SET category_id = v_card_payment_id,
    allocation_status = 'personal'
WHERE user_id = v_user_id
  AND category_id IS NULL
  AND (description ILIKE '%삼성카드%'
       OR description ILIKE '%현대카드%'
       OR description ILIKE '%BC카드%'
       OR description ILIKE '%비씨카드%');

-- 계좌 이체
UPDATE transactions
SET category_id = v_internal_transfer_id,
    allocation_status = 'personal'
WHERE user_id = v_user_id
  AND category_id IS NULL
  AND (description ILIKE '%우리은행%'
       OR description ILIKE '%국민은행%'
       OR description ILIKE '%기업은행%'
       OR description ILIKE '%카뱅%');

-- 학자금
UPDATE transactions
SET category_id = v_student_loan_id,
    allocation_status = 'personal'
WHERE user_id = v_user_id
  AND category_id IS NULL
  AND description ILIKE '%한국장학재단%';

-- 편의점
UPDATE transactions
SET category_id = v_convenience_id,
    allocation_status = 'personal'
WHERE user_id = v_user_id
  AND category_id IS NULL
  AND (description ILIKE '%GS25%'
       OR description ILIKE '%CU%'
       OR description ILIKE '%세븐일레븐%'
       OR description ILIKE '%미니스톱%');

-- 주유비
UPDATE transactions
SET category_id = v_fuel_id,
    allocation_status = 'personal'
WHERE user_id = v_user_id
  AND category_id IS NULL
  AND (description ILIKE '%GS칼텍스%'
       OR description ILIKE '%주유소%'
       OR description ILIKE '%SK주유%');

-- 생명보험
UPDATE transactions
SET category_id = v_life_insurance_id,
    allocation_status = 'personal'
WHERE user_id = v_user_id
  AND category_id IS NULL
  AND description ILIKE '%KB생%';

-- 국민연금
UPDATE transactions
SET category_id = v_pension_id,
    allocation_status = 'personal'
WHERE user_id = v_user_id
  AND category_id IS NULL
  AND description ILIKE '%국민연금%';

-- 이자소득
UPDATE transactions
SET category_id = v_interest_id,
    allocation_status = 'personal'
WHERE user_id = v_user_id
  AND category_id IS NULL
  AND description ILIKE '%이자%';

-- 세금
UPDATE transactions
SET category_id = v_tax_other_id,
    allocation_status = 'personal'
WHERE user_id = v_user_id
  AND category_id IS NULL
  AND (description ILIKE '%국세청%'
       OR description ILIKE '%세무서%'
       OR description ILIKE '%종소세%');

RAISE NOTICE 'Keyword rules and auto-classification completed for user %', v_user_id;

END $$;
```

### 3-3. 자동분류 결과 검증

```sql
-- 적용된 규칙 확인
SELECT keyword, category_id, COUNT(*)
FROM mdt_allocation_rules
WHERE user_id = '{USER_ID}'::UUID
GROUP BY keyword, category_id
ORDER BY category_id;

-- 자동분류된 거래 건수 확인
SELECT category_id, c.name, COUNT(*) as 분류됨_건수
FROM transactions t
LEFT JOIN mdt_categories c ON t.category_id = c.id
WHERE user_id = '{USER_ID}'::UUID
  AND source_raw_data->>'import_type' = '2026_AUTO_IMPORT'
  AND category_id IS NOT NULL
GROUP BY category_id, c.name
ORDER BY 분류됨_건수 DESC;

-- 남은 미분류 거래 확인
SELECT COUNT(*) as 남은_미분류
FROM transactions
WHERE user_id = '{USER_ID}'::UUID
  AND category_id IS NULL;
```

---

## ✅ Phase 4: 검증 체크리스트

완료 후 다음을 확인하세요:

- [ ] **Step 1-1 완료**: Transfer 카테고리 4개 추가됨
- [ ] **Step 1-2 검증**: 쿼리 결과에 id=120-124 항목 보임
- [ ] **Step 2-1 완료**: BulkAssigner에 "🔄 이체/내부거래" 섹션 추가됨
- [ ] **Step 2-2 검증**: 미분류 페이지에서 BulkAssigner 팝오버에 3개 섹션 모두 보임
- [ ] **Step 3-2 완료**: Migration 실행됨
- [ ] **Step 3-3 검증**: 쿼리 결과에 카드결제 등이 분류됨으로 표시됨

---

## 📊 예상 결과

**Before:**
```
미분류: 450건
├─ 삼성카드결제 (9건)
├─ 비씨카드출금 (14건)
├─ 한국장학재단 (44건)
├─ KB생11061 (생명보험, 3건)
└─ 기타 380건
```

**After:**
```
미분류: ~250건
자동 분류됨: ~200건
├─ 카드대금 결제 (30건+)
├─ 내부 이체 (10건+)
├─ 학자금 상환 (44건)
├─ 편의점 (5건+)
└─ 보험료 (10건+)
```

---

## 🔍 주요 결정사항

1. **종소세 추가됨** → `세금 > 기타세금`으로 분류
2. **Transfer 타입 카테고리 추가** → BulkAssigner에 별도 섹션으로 표시
3. **대시보드 영향**: Dashboard RPC는 아직 transfer 타입을 특별히 처리하지 않으므로, 필요시 추후에 RPC 업데이트 가능 (현재는 선택사항)

---

## 🛠️ 실행 방법

### Antigravity가 할 일:

1. **`{USER_ID}` 확인**
   ```bash
   # Supabase에서 User ID 확인
   ```

2. **Phase 1 실행**
   ```bash
   # Migration 1-1 실행 후 반환된 ID들 확인
   # ID 확인 후 Phase 2로 진행
   ```

3. **Phase 2 실행**
   ```bash
   # src/features/refine-ledger/ui/bulk-assigner.tsx 수정
   # 로컬에서 테스트: 미분류 페이지 BulkAssigner 확인
   ```

4. **Phase 3 실행**
   ```bash
   # Migration 3-2 실행 (USER_ID 교체 필수)
   # 결과 검증
   ```

5. **최종 테스트**
   ```bash
   # 미분류 페이지 새로고침
   # 450건 → 250건으로 줄어들었는지 확인
   # 각 카테고리별로 정상 분류되었는지 확인
   ```

---

**문서 작성:** 2026-03-05
**최종 검토:** Claude (AI)
**상태:** ✅ Ready to Implement
