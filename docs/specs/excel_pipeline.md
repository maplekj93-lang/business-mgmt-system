# EXCEL_PIPELINE.md (V3.1)

## 1. Overview
2024년 데이터는 '지출'만 선별적으로 가져오고, 2025년 데이터는 '자산'까지 완벽 동기화합니다.

## 2. The 6-Stage Process

### Stage 1: Context-Aware Ingest
*   **Mode A (Legacy 2024):** 헤더에 `Expense` 포함 시 [부분 추출 모드].
*   **Mode B (Standard 2025):** 헤더에 `대분류` 포함 시 [전체 동기화 모드].

### Stage 2: The Legacy Bridge (2024 Only)
*   **Drop Assets:** 2024 파일의 자산/부채 섹션 무시.
*   **Transposition (Mapping Rule):**
    *   `Expense N` 컬럼을 `MDT_CATALOG.md`의 **"Legacy Bridge Rules"** 섹션을 참조하여 2026 표준 카테고리로 변환한다.
    *   (예: `Expense 6` -> `MDT_CATALOG`에 정의된 해당 소분류로 매핑)
*   **Archive:** 계좌 정보는 `ARCHIVE_ACCOUNT_2024`로 격리.

### Stage 3: The Standard Sync (2025 Only)
*   **Full Sync:** 2025 파일의 자산/부채 시트를 DB와 1:1 동기화.

### Stage 4~6: Validation & Atomic Save
*   **Batch ID:** 업로드 건별 `import_batch_id` 부여 (Undo 기능 지원).
*   **Business Tagging:** '사업' 컬럼 및 '렌탈/스튜디오' 키워드 자동 감지.
*   **Preview:** 글래스모피즘 UI로 변환 내역 확인 후 원자적 트랜잭션 저장.
