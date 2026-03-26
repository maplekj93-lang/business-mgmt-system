# 🗄️ DB 마이그레이션 검증 체크리스트 (2026-03-11)

> **목적:** Sprint 1 + Sprint 2 구현에 필요한 DB 컬럼들이 존재하는지 확인
> **대상:** Antigravity

---

## 📋 검증 방법

Supabase 대시 보드 → **SQL Editor**에서 아래 쿼리들을 **순서대로** 실행하세요.

각 결과에서:
- ✅ **컬럼이 보이면** → "있음" 체크
- ❌ **컬럼이 안 보이면** → "없음" 체크 → 마이그레이션 필요

---

## ✅ Sprint 1 필요 컬럼 (이미 존재하는지 확인)

### 1. `mdt_allocation_rules` 테이블

**쿼리:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'mdt_allocation_rules'
ORDER BY ordinal_position;
```

**필요 컬럼 체크:**

| 컬럼명 | 타입 | 필수 | 상태 |
|--------|------|------|------|
| `id` | UUID | ✅ | [ ] 있음 / [ ] 없음 |
| `user_id` | UUID FK | ✅ | [ ] 있음 / [ ] 없음 |
| `keyword` | TEXT | ✅ | [ ] 있음 / [ ] 없음 |
| `category_id` | INTEGER FK | ✅ | [ ] 있음 / [ ] 없음 |
| `is_business` | BOOLEAN | ⭐ **신규** | [ ] 있음 / [ ] 없음 |
| `business_tag` | TEXT | ⭐ **신규** | [ ] 있음 / [ ] 없음 |
| `match_type` | TEXT | ⭐ **신규** | [ ] 있음 / [ ] 없음 |
| `priority` | INTEGER | ⭐ **신규** | [ ] 있음 / [ ] 없음 |
| `created_at` | TIMESTAMPTZ | ✅ | [ ] 있음 / [ ] 없음 |

**Smart Tagging Part 3 필요 정보:**
```sql
-- priority 컬럼의 기본값 확인
SELECT column_name, column_default
FROM information_schema.columns
WHERE table_name = 'mdt_allocation_rules' AND column_name = 'priority';
```

Result:
- DEFAULT 10이면 ✅
- NULL이면 ❌ (마이그레이션 재실행 필요)

---

### 2. `transactions` 테이블

**쿼리:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'transactions'
ORDER BY ordinal_position;
```

**필요 컬럼 체크:**

| 컬럼명 | 타입 | 필수 | 상태 |
|--------|------|------|------|
| `id` | UUID | ✅ | [ ] 있음 / [ ] 없음 |
| `user_id` | UUID FK | ✅ | [ ] 있음 / [ ] 없음 |
| `date` | DATE | ✅ | [ ] 있음 / [ ] 없음 |
| `amount` | NUMERIC | ✅ | [ ] 있음 / [ ] 없음 |
| `description` | TEXT | ✅ | [ ] 있음 / [ ] 없음 |
| `category_id` | INTEGER FK | ✅ | [ ] 있음 / [ ] 없음 |
| `allocation_status` | TEXT | ✅ | [ ] 있음 / [ ] 없음 |
| `excluded_from_personal` | BOOLEAN | ⭐ **신규** | [ ] 있음 / [ ] 없음 |

**기본값 확인:**
```sql
SELECT column_name, column_default
FROM information_schema.columns
WHERE table_name = 'transactions' AND column_name = 'excluded_from_personal';
```

Result:
- DEFAULT false이면 ✅
- NULL이면 ❌

---

### 3. `assets` 테이블 (미분류 상세 패널용)

**쿼리:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'assets'
ORDER BY ordinal_position;
```

**필요 정보:**

| 정보 | 필수 | 상태 |
|------|------|------|
| `id` 컬럼 존재 | ✅ | [ ] 있음 / [ ] 없음 |
| `name` 컬럼 존재 (계좌/카드명) | ✅ | [ ] 있음 / [ ] 없음 |
| `owner_type` 컬럼 존재 (광준/의영/공동) | ✅ | [ ] 있음 / [ ] 없음 |
| `transactions.asset_id` FK 존재 | ✅ | [ ] 있음 / [ ] 없음 |

**FK 확인:**
```sql
SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE table_name = 'transactions' AND column_name = 'asset_id';
```

---

## ⭐ Sprint 2 필요 컬럼 (Phase 2용, 나중에 확인)

### 4. `projects` 테이블

**쿼리:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;
```

**필요 컬럼 체크:**

| 컬럼명 | 타입 | 필수 | 상태 |
|--------|------|------|------|
| `invoice_sent_date` | DATE | ⭐ **신규** | [ ] 있음 / [ ] 없음 |
| `expected_payment_date` | DATE | ⭐ **신규** | [ ] 있음 / [ ] 없음 |
| `actual_payment_date` | DATE | ⭐ **신규** | [ ] 있음 / [ ] 없음 |

---

### 5. `clients` 테이블

**확인:** 이 테이블이 있는지부터 확인

```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'clients'
);
```

Result:
- `true` → [ ] 있음 (Sprint 2용)
- `false` → [ ] 없음 (Phase 4용, 나중에 생성)

**있으면 이 컬럼들 확인:**

| 컬럼명 | 타입 | 필수 | 상태 |
|--------|------|------|------|
| `avg_payment_lead_days` | INTEGER | ⭐ **신규** | [ ] 있음 / [ ] 없음 |
| `total_projects_count` | INTEGER | ⭐ **신규** | [ ] 있음 / [ ] 없음 |
| `total_revenue` | NUMERIC | ⭐ **신규** | [ ] 있음 / [ ] 없음 |

---

## 🚨 마이그레이션 필요 여부 판정

### Sprint 1 필수 (지금)

```
필요 컬럼:
  - mdt_allocation_rules: is_business, business_tag, match_type, priority
  - transactions: excluded_from_personal

미적용 항목:
  [ ] 모두 있음 → 마이그레이션 불필요 ✅
  [ ] 일부 없음 → 아래 마이그레이션 SQL 실행

[ ] 확인했나? (체크후 진행)
```

### Sprint 2 선택 (나중에)

```
필요 컬럼:
  - projects: invoice_sent_date, expected_payment_date, actual_payment_date
  - clients: avg_payment_lead_days, total_projects_count, total_revenue

미적용 항목:
  [ ] 모두 있음 → 마이그레이션 불필요 ✅
  [ ] 일부 없음 → Sprint 2 시작 전에 실행
```

---

## 🔧 마이그레이션 SQL (필요시 실행)

### Sprint 1용 마이그레이션

Supabase → SQL Editor에서 **전체 선택 후 실행:**

```sql
-- ================================================================
-- Sprint 1 Migration: Smart Tagging Enhancement
-- ================================================================

-- 1. mdt_allocation_rules 테이블 확장 (Smart Tagging Part 1-3용)
ALTER TABLE public.mdt_allocation_rules
    ADD COLUMN IF NOT EXISTS is_business        BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS business_tag       TEXT,
    ADD COLUMN IF NOT EXISTS match_type         TEXT DEFAULT 'contains',
    ADD COLUMN IF NOT EXISTS priority           INTEGER DEFAULT 10;

-- 2. transactions 테이블 확장 (Sprint 2 이중 차단용)
ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS excluded_from_personal BOOLEAN DEFAULT false;

-- 검증 쿼리 (실행 확인용)
SELECT COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_name IN ('mdt_allocation_rules', 'transactions')
  AND column_name IN ('is_business', 'business_tag', 'match_type', 'priority', 'excluded_from_personal');
-- Result: 5개 행이 나와야 함
```

**실행 후 결과:**
```
- "5 rows" → ✅ 성공
- "0 rows" 또는 에러 → ❌ 실패 (다시 실행 또는 문의)
```

---

## 📝 결과 보고 형식

**검증 완료 후 다음과 같이 보고해주세요:**

```markdown
## DB 마이그레이션 검증 결과 (2026-03-XX)

### Sprint 1 필수 컬럼

#### mdt_allocation_rules
- [x] is_business ✅ 있음
- [x] business_tag ✅ 있음
- [x] match_type ✅ 있음
- [x] priority ✅ 있음 (DEFAULT 10)

#### transactions
- [x] excluded_from_personal ✅ 있음 (DEFAULT false)

#### assets
- [x] name ✅ 있음
- [x] owner_type ✅ 있음

### 판정
✅ Sprint 1 구현 준비 완료 (마이그레이션 불필요)

### 추가 사항
- (있으면 추가 기재)
```

---

## ❓ 문제 발생 시

### "컬럼이 없어요"

**해결:**
1. 위 마이그레이션 SQL 전체 복사
2. Supabase → SQL Editor에 붙여넣기
3. "RUN" 버튼 클릭
4. 검증 쿼리 다시 실행

### "마이그레이션이 실패했어요"

```
에러 메시지를 전체 복사해서 보고
  → CLAUDE가 원인 분석 및 수정 SQL 제공
```

### "DEFAULT 값이 잘못되었어요"

```sql
-- 기본값 수정 (예: priority)
ALTER TABLE public.mdt_allocation_rules
  ALTER COLUMN priority SET DEFAULT 10;

-- 재확인
SELECT column_default
FROM information_schema.columns
WHERE table_name = 'mdt_allocation_rules' AND column_name = 'priority';
```

---

## ✨ 다음 단계

### 1단계: 이 체크리스트 완료 ✅
- Sprint 1 필수 컬럼 모두 확인
- 결과 보고

### 2단계: Part 1-3 구현 시작
- Smart_Tagging_Optimization.md Part 1-3 구현
- Mobile_UX_Optimization.md 반응형 구현

### 3단계: Sprint 2 준비 (이후)
- Sprint 2 필수 컬럼 재확인
- L_and_D_ERP_Sprint2_Design.md 검토

---

**검증 완료되면 구현 시작할 준비 됨! 🚀**
