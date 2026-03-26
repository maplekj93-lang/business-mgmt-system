# 이중 지출 차단 (Double-Count Prevention) — 기능 명세서

> **작성일:** 2026-03-11
> **작성자:** Antigravity
> **상태:** 확정
> **관련 Phase:** Sprint 2 (Ledger Optimization)

---

## 1. 목적 (Why)

가계부 앱 내에서 사업비로 분류된 지출이 개인 순자산 통계에 이중으로 잡히는 문제를 해결합니다. '사업용'으로 할당된 거래를 개인 지출 집계에서 제외하여 회계적 정확성을 확보합니다.

---

## 2. 요구사항 (What)

### 기능 요구사항
- [ ] 거래 할당 시 `is_business = true` 또는 특정 사업 단위 지정 시 `excluded_from_personal = true` 자동 설정.
- [ ] 개인 지출 대시보드 통계(`get_monthly_stats` RPC 및 API)에서 제외 필터 적용.
- [ ] 가계부 목록 UI에서 제외된 항목임을 명확히 표시 (회색조 처리 및 '운영비' 뱃지).

---

## 3. DB 스키마 변경 (Database)

### 신규 테이블 / 컬럼
```sql
-- transactions 테이블 확장
ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS excluded_from_personal BOOLEAN DEFAULT false;
```

---

## 4. FSD 파일 구조 (Architecture)

- `src/entities/transaction/api/get-monthly-stats.ts`: 통계 쿼리에 필터 추가.
- `src/features/allocate-transaction/ui/allocation-dialog.tsx`: 할당 로직에 플래그 업데이트 추가.
- `src/widgets/transaction-history/ui/TransactionRow.tsx`: 스타일 분기 처리.

---

## 5. 체크리스트 (Definition of Done)

- [ ] DB `excluded_from_personal` 컬럼 생성 확인.
- [ ] `get_dashboard_stats` RPC 수정 또는 결과 필터링 적용.
- [ ] 할당 시 토스트 메시지 및 플래그 변경 확인.
- [ ] 가계부 리스트에서 제외된 항목의 시각적 구분 확인.
