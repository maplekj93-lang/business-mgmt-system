# 📑 Import Sync Guide (통합 가이드)

> **목표:** 사용자가 각 결제수단(통장/카드/에셋)별 엑셀 내역을 임포트할 때 중복 입력 방지 및 편의 제공

---

## 1. 기능 개요
여러 결제수단을 각각 기간별로 임포트할 때 중복되거나 누락된 구간이 생기는 것을 방지합니다. 각 자산별 **"마지막 거래일자"**와 **"마지막 동기화 일자"**를 확인하여, 안전한 **"임포트 추천 시작일"**을 안내하고 해시 기반으로 중복 데이터를 자동 필터링합니다.

## 2. 주요 제공 기능
- **동기화 현황 표시:** 마지막 거래일 및 마지막 업데이트(동기화) 날짜 시각화.
- **임포트 추천 시작일 안내:** 마지막 거래일 기준 3일 전부터 여유 있게 다운로드하도록 안내.
- **중복 방지 (Idempotency):** `date | asset_id | amount | description` 조합의 SHA-256 해시를 사용하여 중복 진입 차단.
- **뱅킹 바로가기:** 자산명에 따른 은행/카드사 웹사이트 퀵 링크 제공.

## 3. 기술 명세 (Technical Spec)

### 3.1 DB 스키마
- `assets.last_synced_at`: 마지막 성공적인 엑셀 임포트 시점.
- `transactions.import_hash`: 중복 방지용 고유 해시 (조건부 UNIQUE 인덱스 사용).
- `transactions.source`: 데이터 출처 (`MANUAL` | `EXCEL`).

### 3.2 중복 방지 로직
- **해시 생성:** `trim(description)` 및 `|` 구분자를 사용하여 데이터 정규화 후 해싱.
- **벌크 처리:** 수백 건 업로드 시 타임아웃 방지를 위해 150건 단위로 청킹(Chunking)하여 `upsert`.

---

## 4. 구현 가이드 (Step-by-Step)

### Step 1: DB Migration
```sql
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS import_hash TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'EXCEL'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_import_hash 
  ON public.transactions(import_hash) WHERE import_hash IS NOT NULL;
```

### Step 2: 유틸 함수 (`src/features/import-excel/lib/utils.ts`)
- `generateImportHash`: SHA-256 해시 생성.
- `calculateRecommendedDate`: 마지막 거래일 - 3일 계산.
- `chunkArray`: 대량 업로드 분할 기능.

### Step 3: UI 컴포넌트 (`ImportSyncGuide.tsx`)
- 자산별 카드 UI 제공.
- 신용카드의 경우 "어제까지 권장" 경고 문구 노출 (Pending 처리 대응).

---

## 5. 테스트 체크리스트
- 동일 파일 재업로드 시 "0건 추가됨"으로 정확히 차단되는지 확인.
- `import_hash`가 없는 기존 수동 데이터와의 공존 확인.
- 대량 데이터(150건 이상) 업로드 시 청킹 로직 정상 작동 확인.
