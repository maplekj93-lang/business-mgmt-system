# Phase 2 Design: AI Matching Engine & Action Center

## 1. Objectives
- **자동 매칭**: 은행 거래내역(카카오페이 충전)과 페이 거래내역(실제 결제)을 지능적으로 연결.
- **가맹점명 정규화**: "GS25 마포한림점" -> "편의점/GS25"로 변환 및 상위 태그 제안.
- **Action Center**: 사용자가 AI 추천 항목을 검토하고 원클릭으로 컨펌할 수 있는 대시보드 UI 제공.

## 2. Shared Architecture: Matching Engine

### 2.1 Multi-Layered Processing
1.  **Exact Match (Rule-based)**: 사용자가 정의한 `mdt_allocation_rules` 우선 적용.
2.  **Transfer Identification**: 
    -   동일 금액, 근접 시간대(± 5분) 내에서 `Asset A (Withdrawal)` <-> `Asset B (Deposit)` 매칭.
    -   예시: 국민은행 (-10,000, "카카오페이충전") <-> 카카오페이 (+10,000, "충전") 매칭.
3.  **Fuzzy Match (Normalization)**: 
    -   지점명 제거, 공백 제거 후 과거 거래 이력 기반 카테고리 추론.
4.  **AI Classification (GPT/Gemini)**: 
    -   모호한 내역(예: "루즈 도어")에 대해 업종 추론 및 태그 제안.

### 2.2 Metadata Structure
`transactions` 테이블의 `source_raw_data` 필드를 활용하거나 별도의 `metadata` 필드에 다음 정보를 저장합니다:
- `is_ai_suggested`: boolean (AI가 추천한 상태인지 여부)
- `suggestion_confidence`: number (0.0 ~ 1.0)
- `linked_transaction_id`: UUID (매칭된 상대 거래 ID)

## 3. UI/UX: Action Center
대시보드 상단에 **"확인이 필요한 내역 (N건)"** 위젯 배치.
-   **카드 형태**: [날짜] [원래 가맹점명] -> [추천 카테고리/태그] [금액]
-   **액션**: `Confirm (V)`, `Edit (Edit Icon)`, `Ignore (X)`
-   **벌크 액션**: "모두 승인" 기능 포함.

## 4. Workflows (Draft)
1.  Excel 업로드 -> `upload-batch.ts` 실행.
2.  매칭 엔진 가동 -> 중복 제거 및 이체 식별.
3.  카테고리 미지정 항목에 대해 AI 제안 생성 (`allocation_status = 'pending'`).
4.  사용자가 Action Center에서 확인 -> `allocation_status = 'personal' or 'business'`로 최종 확정.

## 5. Next Step: Implementation Plan
-   Action Center 위젯 컴포넌트 개발.
-   `calculate_cashflow_stats` RPC 및 API 개선 (Pending 상태 포함 여부 결정).
-   AI 제안 스케줄러 혹은 트리거 개발.
