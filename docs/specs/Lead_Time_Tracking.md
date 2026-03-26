# 입금 지연 추적 (Payment Lead-Time Tracker) — 기능 명세서

> **작성일:** 2026-03-11
> **작성자:** Antigravity
> **상태:** 확정 (Sprint 2 범위 한정)
> **관련 Phase:** Sprint 2 (Ledger Optimization)

---

## 1. 목적 (Why)

예상 입금일 대비 지연되고 있는 프로젝트를 대시보드에서 즉시 확인하여 자금 회수 효율을 높입니다. (본 Sprint에서는 기본 추적 기능에 집중하며, 상세 클라이언트 관리는 Phase 4에서 진행함)

---

## 2. 요구사항 (What)

### 기능 요구사항
- [ ] **데이터 관리**: 프로젝트 테이블에 발행일, 예정일, 실제입금일 기록.
- [ ] **알림 위젯**: 메인 대시보드에 '미수금/지연' 알림 카드 노출.
- [ ] **자동 매칭**: 수입 거래 매칭 시 `actual_payment_date` 자동 기입.

---

## 3. DB 스키마 변경 (Database)

### 신규 테이블 / 컬럼
```sql
-- projects 테이블 확장
ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS invoice_sent_date DATE,
    ADD COLUMN IF NOT EXISTS expected_payment_date DATE,
    ADD COLUMN IF NOT EXISTS actual_payment_date DATE;
```

---

## 4. FSD 파일 구조 (Architecture)

- `src/widgets/receivables-alert/ui/ReceivablesAlertCard.tsx`: 신규 알림 위젯.
- `src/entities/project/model/types.ts`: 타입 정의 업데이트.
- `src/features/match-income/api/update-payment-date.ts`: 날짜 업데이트 서버 액션.

---

## 5. 체크리스트 (Definition of Done)

- [ ] 예정일 초과 프로젝트 필터링 로직 검증.
- [ ] 대시보드 위젯 노출 및 스타일 확인 (지연 시 Red/Amber 강조).
- [ ] 실제 입금일 기록 시 위젯에서 즉시 제거 확인.
