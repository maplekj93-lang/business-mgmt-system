# 스마트 태깅 Lite V2 — 기능 명세서

> **작성일:** 2026-03-11
> **작성자:** Antigravity
> **상태:** 확정
> **관련 Phase:** Sprint 2 (Smart Tagging)

---

## 1. 목적 (Why)

수동 분류의 번거로움을 줄이기 위해 사용자 정의 룰 관리 기능을 도입하고, 반복적인 거래 패턴을 자동 학습/적용하는 관리 도구를 제공합니다.

---

## 2. 요구사항 (What)

### 기능 요구사항
- [ ] **관리 UI**: `/settings/tagging-rules`에서 규칙 등록 및 우선순위 조정.
- [ ] **자동화**: 미분류 내역에서 '일괄 자동 분류' 기능 (Confidence: High 기준).
- [ ] **우선순위 엔진**: Exact Match > Contains Match > Priority 순의 매칭 로직 적용.

---

## 3. DB 스키마 변경 (Database)

### 신규 테이블 / 컬럼
```sql
-- mdt_allocation_rules 확장
ALTER TABLE public.mdt_allocation_rules
    ADD COLUMN IF NOT EXISTS match_type TEXT DEFAULT 'contains',
    ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 10;
```

---

## 4. FSD 파일 구조 (Architecture)

- `src/app/(dashboard)/settings/tagging-rules/page.tsx`: 규칙 관리 페이지.
- `src/features/refine-ledger/api/suggest-category.ts`: 매칭 엔진 고도화.
- `src/app/(dashboard)/transactions/unclassified/page.tsx`: 일괄 처리 UI.

---

## 5. 체크리스트 (Definition of Done)

- [ ] 규칙 로딩 및 CRUD 작동 확인.
- [ ] 대소문자 및 공백 무시 매칭 검증.
- [ ] 자동 분류 후 결과 요약 토스트 노출.
