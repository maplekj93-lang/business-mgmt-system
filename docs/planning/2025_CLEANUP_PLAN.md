# 2025 가계부 데이터 정리 계획

**최종 업데이트**: 2025-03-05
**상태**: Phase 1 owner_type 시스템 도입 중 → Phase 2 미분류 정리 예정

---

## 1. 현재 데이터 상황 (확정)

### Import된 데이터 현황 ✅
- **총 건수**: 1,444건 (Nelna 가계부 '가계부 기록' 시트만)
  - 지출: 1,365건
  - 이동(이체): 35건
  - 수입: 44건

### 현재 미분류 현황 ⚠️
| 분류 | 건수 | 비고 |
|------|------|------|
| **카테고리 미분류** | ~81건 | category_id IS NULL |
| **자산 미지정** | ~40-50건 | asset_id IS NULL (포함) |
| **소유자 미상** | 일부 | owner_type 도입 후 정리 |

**참고**: 1,852건 수치는 이전 임시 테스트 데이터 포함. 현재 확정 건수는 **1,444건**

---

## 2. Phase 1: owner_type 시스템 도입 (진행 중)

📖 **가이드 문서**:
- `IMPLEMENTATION_GUIDE.md` - 기술 상세 설명
- `TODO_FOR_ANTRIGRAVITY.md` - 구체적 할일 목록

### 진행 상황

```
[ ] Phase 1-1: DB 마이그레이션 (owner_type 컬럼 추가)
[ ] Phase 1-2: 데이터 마이그레이션 (자산 owner_type 복사)
[ ] Phase 1-3: 코드 변경 (TypeScript)
[ ] Phase 1-4: UI 개선 (드롭다운)
[ ] Phase 1-5: 테스트 & 검증
```

**완료 후**: 모든 1,444건 거래내역이 `owner_type` 필드를 가짐

---

## 3. Phase 2: 미분류 내역 정리 (Phase 1 완료 후)

> ⏳ 예상 시간: 3-4시간

### 2-1. 키워드 기반 카테고리 자동 매핑

**목표**: 81건 미분류 중 ~60건을 SQL로 자동 분류

```sql
-- 예: "이자" 관련 자동 분류
UPDATE transactions
SET category_id = (
  SELECT id FROM mdt_categories
  WHERE name = '금융 > 이자' LIMIT 1
)
WHERE category_id IS NULL
  AND description LIKE '%이자%';

-- 예: 개인 이름 (이체로 추정)
UPDATE transactions
SET category_id = (
  SELECT id FROM mdt_categories
  WHERE name LIKE '%이체%' LIMIT 1
)
WHERE category_id IS NULL
  AND (description LIKE '정광준%'
       OR description LIKE '송의영%'
       OR description LIKE '장의선%');

-- 예: 세금
UPDATE transactions
SET category_id = (
  SELECT id FROM mdt_categories
  WHERE name = '사업 > 세금' LIMIT 1
)
WHERE category_id IS NULL
  AND description LIKE '%부가세%';
```

### 2-2. 자산 재매핑 (source_raw_data 기반)

```sql
-- source_raw_data의 계좌명으로 자산 찾아 매핑
UPDATE transactions t
SET asset_id = a.id
FROM assets a
WHERE t.asset_id IS NULL
  AND t.source_raw_data IS NOT NULL
  AND (
    t.source_raw_data->>'deposit_account' LIKE '%' || a.name || '%'
    OR t.source_raw_data->>'withdrawal_account' LIKE '%' || a.name || '%'
  );
```

### 2-3. 소유자 자동 할당 (asset owner_type 기반)

```sql
-- 자산이 매핑되면 그 자산의 owner_type으로 자동 할당
UPDATE transactions t
SET owner_type = a.owner_type
FROM assets a
WHERE t.asset_id = a.id
  AND (t.owner_type IS NULL OR t.owner_type = 'other');

-- 그 외 자산 미지정 데이터는 'other' 유지
UPDATE transactions
SET owner_type = 'other'
WHERE owner_type IS NULL;
```

### 2-4. 수동 UI 정리

**남은 미분류** (~10-20건):
1. 필터링: `category_id IS NULL` 또는 `owner_type = 'other'`
2. 각 내역 클릭 → 자산/소유자/카테고리 수동 지정
3. "동일 내용 일괄 업데이트" 기능 활용

---

## 4. Phase 2 세부 진행표

| 순서 | 담당 | 작업 | 예상 시간 | 상태 |
|------|------|------|---------|------|
| 2-1 | Antigravity | 키워드 기반 카테고리 SQL 작성 | 1시간 | ✅ |
| 2-2 | Antigravity | source_raw_data 자산 재매핑 SQL | 1시간 | ✅ |
| 2-3 | Antigravity | 소유자 자동 할당 SQL | 30분 | ✅ |
| 2-4 | 사용자 | UI에서 남은 미분류 수동 정리 | 30분 | ⏳ |
| 검증 | 모두 | 최종 미분류 건수 확인 | 15분 | ⏳ |

---

## 5. 검증 쿼리

**Phase 2 완료 후 실행**:

```sql
-- 최종 미분류 확인
SELECT
  COUNT(CASE WHEN category_id IS NULL THEN 1 END) as unclassified_category,
  COUNT(CASE WHEN asset_id IS NULL THEN 1 END) as unclassified_asset,
  COUNT(CASE WHEN owner_type IS NULL OR owner_type = 'other' THEN 1 END) as unclassified_owner
FROM transactions;

-- 각 자산별 거래 건수
SELECT a.name, COUNT(t.id) as count
FROM transactions t
LEFT JOIN assets a ON t.asset_id = a.id
GROUP BY a.name, a.id
ORDER BY count DESC;

-- 각 소유자별 거래 건수
SELECT owner_type, COUNT(*) as count
FROM transactions
GROUP BY owner_type
ORDER BY count DESC;
```

**목표**: 모두 0에 가까운 수치로 정리

---

## 6. 주의사항

1. **Phase 1 완료 필수**
   - owner_type 컬럼 없이는 소유자 정리 불가능

2. **UPDATE 전에 SELECT로 테스트**
   ```sql
   -- 먼저 몇 건이 영향받을지 확인
   SELECT COUNT(*) FROM transactions
   WHERE category_id IS NULL AND description LIKE '%이자%';
   ```

3. **자산 이름 정확성**
   - assets 테이블의 name과 source_raw_data가 정확히 매칭되어야 함
   - LIKE 사용 시 주의 (예: '%기업%' 너무 넓음)

4. **일괄 업데이트 역순**
   - 가장 명확한 것부터 (이자 → 이체 → 기타)
   - 중복 업데이트 방지

---

## 7. 데이터 품질 체크포인트

| 항목 | Before | After | 목표 |
|------|--------|-------|------|
| 총 거래 건수 | 1,444 | 1,444 | 변화 없음 |
| 카테고리 미분류 | ~81 | ~0 | 0건 |
| 자산 미지정 | ~40-50 | ~0 | 0건 |
| 소유자 미상 | 일부 | ~0 | 0건 |

---

## 8. 다음 단계

1. **즉시** (Phase 1):
   - `TODO_FOR_ANTRIGRAVITY.md` 따라 진행
   - Phase 1-5 완료 후 보고

2. **Phase 1 완료 후**:
   - 이 문서의 Phase 2 SQL 실행
   - UI에서 최종 정리

3. **최종**:
   - 검증 쿼리 실행 및 확인

---

**최종 목표**: 2025 가계부 1,444건 데이터 완벽 정리 ✅
