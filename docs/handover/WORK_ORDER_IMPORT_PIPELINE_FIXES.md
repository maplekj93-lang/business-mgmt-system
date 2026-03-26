# 작업 명세서: Import Pipeline DB 스키마 수정

> 작성자: Claude (리뷰어)
> 날짜: 2026-03-23
> 우선순위: P0 — 이 수정 없이는 임포트 기능 전체가 런타임에서 실패함

---

## 왜 이 작업이 필요한가

현재 코드에서 `upload-batch.ts`가 `transactions` 테이블에 INSERT 시
`raw_description`과 `metadata` 컬럼을 payload에 포함하는데,
두 컬럼이 DB에 존재하지 않아 **모든 임포트 요청이 실패**한다.

또한 `manual_override` 컬럼도 DB에 없어서:
- `apply-tagging-rules.ts`가 해당 값을 SELECT하면 항상 `null` 반환
- `update-transaction.ts`가 `manual_override: true`를 업데이트하면 에러

→ import pipeline 핵심 기능인 "수동 분류 보호" 전체가 동작하지 않음.

---

## Task 1: DB 마이그레이션 작성 및 적용 (P0)

**파일 생성:** `supabase/migrations/20260323_import_pipeline_columns.sql`

```sql
-- Import Pipeline: manual_override + raw_description 컬럼 추가
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS manual_override BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS raw_description TEXT DEFAULT '';

-- 기존 데이터 backfill
UPDATE public.transactions
SET raw_description = COALESCE(description, '')
WHERE raw_description IS NULL OR raw_description = '';

-- 인덱스: manual_override=false 항목만 태깅 룰 적용 시 필터링에 사용
CREATE INDEX IF NOT EXISTS idx_transactions_manual_override
ON public.transactions(user_id, manual_override)
WHERE manual_override = false;
```

**적용 방법:**
```bash
npx supabase db push
# 또는 Supabase MCP를 통해 apply_migration 호출
```

**타입 재생성:**
```bash
npx supabase gen types typescript --local > src/shared/types/database.types.ts
```

---

## Task 2: `upload-batch.ts` — `metadata` 필드 처리 수정

**파일:** `src/features/ledger-import/api/upload-batch.ts`

**문제:** payload의 `metadata` 필드가 transactions 테이블에 없는 컬럼.
`metadata`는 `source_raw_data` JSONB 안에 넣어야 함.

**수정 전:**
```typescript
return {
    ...
    metadata: {
        ai_confidence: match.confidence,
        ai_suggestion_type: match.suggestionType,
        ...match.metadata
    },
    source_raw_data: {
        original_category: tx.categoryRaw,
        import_type: 'bulk_excel_2025',
        _bank: explicitAccountHint
    },
}
```

**수정 후:**
```typescript
return {
    ...
    source_raw_data: {
        original_category: tx.categoryRaw,
        import_type: 'bulk_excel_2025',
        _bank: explicitAccountHint,
        ai_confidence: match.confidence,
        ai_suggestion_type: match.suggestionType,
        ...(match.metadata || {}),
    },
}
```

---

## Task 3: `apply-tagging-rules.ts` — DB 쿼리에 `.eq('manual_override', false)` 필터 추가 (선택적 최적화)

**파일:** `src/features/refine-ledger/api/apply-tagging-rules.ts`

현재 코드는 루프 안에서 `if (tx.manual_override) continue;`로 필터링하는데,
DB 레벨에서 필터링하면 불필요한 데이터를 가져오지 않아도 된다.

**현재 (허용 가능):**
```typescript
.select('id, description, manual_override, date, amount')
.in('id', transactionIds)
.eq('user_id', user.id)
```

**권장 (DB 레벨 필터):**
```typescript
.select('id, description, date, amount')
.in('id', transactionIds)
.eq('user_id', user.id)
.eq('manual_override', false)  // ← 추가
```

이렇게 하면 `manual_override` 컬럼을 SELECT할 필요도 없고, 루프의 조건 체크도 불필요해진다.

---

## Task 4: Settings nav에 누락된 탭 추가 (P2)

**파일:** `src/app/(dashboard)/settings/layout.tsx`

다음 두 탭이 nav에 없음 — 페이지는 존재함:

| 탭 | 경로 | 상태 |
|---|---|---|
| 구독 관리 | `/settings/recurring-expenses` | 페이지 있음, nav에서 제거됨 |
| 스마트 태깅 | `/settings/tagging-rules` | 페이지 있음, nav에 없었음 |

**수정:** SETTINGS_NAV 배열에 추가:
```typescript
{ href: '/settings/tagging-rules',      label: '스마트 태깅',  icon: Tag },
{ href: '/settings/recurring-expenses', label: '구독 관리',    icon: RefreshCw },
```

---

## 검증 기준

- [ ] `npx supabase db push` 실행 시 에러 없음
- [ ] `src/shared/types/database.types.ts`에 `manual_override`, `raw_description` 컬럼 반영됨
- [ ] Import 위젯에서 샘플 파일 업로드 시 에러 없이 성공
- [ ] 카테고리 수동 변경 후 "자동 분류" 버튼 눌렀을 때 해당 트랜잭션 유지됨
- [ ] `/settings`에서 "스마트 태깅"과 "구독 관리" 탭 클릭 가능

---

## 작업 순서

1. Task 1 (마이그레이션) — 먼저 실행, 이게 모든 다른 코드의 전제조건
2. Task 2 (metadata 이동) — 마이그레이션 후
3. Task 3 (필터 최적화) — 선택적, 코드 정리 목적
4. Task 4 (nav 추가) — UI 수정, 독립적으로 가능

---

> 이 명세서는 `/review` 결과에서 발견된 P0 이슈를 기반으로 작성되었습니다.
