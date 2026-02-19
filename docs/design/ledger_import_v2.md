# Ledger Import System V2.0 Design Document 🏦🧾

## 1. Overview
The goal is to upgrade the current Excel import system to support multiple bank formats, robust cancellation handling, and receipt-based data enrichment.

## 2. Multi-Format Bank Parser Strategy

### 2.1. The `BankAdapter` Pattern
Instead of a single `parseExcel` function, we will implement an adapter pattern where each bank has a defined profile.

```typescript
type BankProfile = {
    name: string; // 'Samsung', 'Hyundai', 'Toss', etc.
    keywords: string[]; // Keywords to identify sheet/columns
    mapping: {
        date: string | string[];     // Column header(s) for Date
        time?: string | string[];    // Column header for Time (Optional)
        amount: string | string[];   // Column header for Amount
        merchant: string | string[]; // Column header for Merchant
        status?: string;             // Column for 'Cancel' status
        authCode?: string;           // Column for Auth Code (crucial for linking cancels)
    };
    transforms?: {
        // Bank specific cleanup logic
        parseAmount: (val: any) => number;
        parseStatus: (val: any) => 'approved' | 'cancelled';
    }
}
```

### 2.2. Supported Formats (Analyzed)

#### 1. Samsung Card (`1월2월삼성카드.xlsx`)
- **Key**: Matches `카드번호` AND `승인일자`
- **Columns**:
    - Date: `승인일자` (Format: `YYYY.MM.DD`)
    - Time: `승인시각` (Format: `HH:MM:SS`)
    - Amount: `승인금액(원)`
    - Merchant: `가맹점명`
    - Status: `취소여부` (Value: `전체취소` -> Cancelled)
    - AuthCode: `승인번호`

#### 2. BC Card / Generic (`Approve...xls`)
- **Key**: Matches `이용카드` AND `승인번호`
- **Columns**:
    - Date: `이용일자` (Format: `YYYY.MM.DD`)
    - Time: `이용시간` (Format: `HH:MM:SS`)
    - Amount: `이용금액(원)`
    - Merchant: `이용가맹점`
    - Status: `승인상태` (Check for `취소`)
    - AuthCode: `승인번호`

#### 3. Hyundai Card (`hyundaicard...xls`)
- **Key**: Matches `이용가맹점` AND `결제후잔액`
- **Columns**:
    - Date: `이용일자` (Format: `YYYY/MM/DD`)
    - Amount: `이용금액`
    - Merchant: `이용가맹점`
    - Status: `상태`
    - AuthCode: `승인번호`

#### 4. Bank Account (Shinhan/Hana Style)
- **Key**: Matches `의뢰인/수취인` AND `거래후잔액(원)`
- **Columns**:
    - Date: `거래일자`
    - Time: `거래시간` (Column Index 11)
    - Income: `입금액(원)`
    - Expense: `출금액(원)`
    - Description: `적요` or `기재내용` or `의뢰인/수취인`
    - Balance: `거래후잔액(원)` (Critical for deduplication)

#### 5. Kakao Bank (Analyzed)
- **Key**: Matches `거래일시` AND `거래후 잔액` (Header check required)
- **Columns** (Based on `Row 11` sample):
    - Date: Column 1 (`2025.03.01 03:22:08`)
    - Type: Column 2 (`입금` or `출금`)
    - Amount: Column 3 (Signed string with commas, e.g. `"-2,037,273"`)
    - Balance: Column 4
    - Merchant/Person: Column 5 (`예금이자`, `오픈뱅킹`)
    - Description: Column 6 (`입출금통장 이자`)

## 3. Smart Deduplication & Cancellation Logic

### 3.1. The "Net-Zero" Heuristic (Kakao T Pre-auth)
User wants to ignore (Deposit -> Cancel) pairs so they don't clutter the ledger.

**Algorithm:**
1. **Ingest Phase**: Parse all rows into a raw list.
2. **Analysis Phase**: Group by `AuthCode` (if available) or `(Merchant, Abs(Amount))`.
3. **Filtering**:
   - If a group contains `[+A, -A]` (Payment, Cancel):
     - Check timestamp difference.
     - If both exist in the *same batch*, **Drop Both**.
     - (User logic: "그 거래는 안가져오거나")
   - If a group contains `[+A, -B]` where `A != B` (Partial Cancel):
     - **Keep Both**. (User logic: "일부 취소했을때는 해당 안되게")
     - This preserves the data trail (Bought 50k, Returned 10k -> Net 40k).

### 3.3. Partial Cancellation Linking (New)
User wants to know *which* original transaction was cancelled.
- **Strategy**: Use `AuthCode` (승인번호) as the unique join key.
- **Schema Update**:
    - Add `related_transaction_id` (UUID, nullable) to `transactions` table.
    - Add index on `source_raw_data->>'auth_code'` for performant lookups.
- **Isomorphism**:
    - When a cancellation (negative amount) is imported:
        1. Query DB for transaction with same `AuthCode` and positive amount.
        2. If found, set `related_transaction_id = found.id`.
        3. UI displays "Original Transaction: [Date] [Title] ([Amount])" locally.

### 3.2. Existing Data Check
- Before inserting, hash the transaction `hash(date, amount, description, auth_code)` and check Supabase for existence.

## 4. Receipt Enrichment & Split Transactions (Design)

### 4.1. The Problem
Coupang/Naver Pay transactions appear as lump sums (e.g., 40,910 KRW). The user wants to break this down using receipt images/PDFs.

### 4.2. Proposed Workflow
1. **Upload Transaction**: Import the bank Excel first. The 40,910 KRW transaction is created.
2. **Upload Receipt**: User uploads an image/PDF to a "Receipt Matcher" widget.
3. **OCR Processing**:
   - Use GPT-4o or similar Vision API to extract: `{ date, totalAmount, items: [{ name, price, qty }] }`.
4. **Matching**:
   - System searches DB for a transaction matching `date` and `totalAmount`.
5. **Action: Split**:
   - If matched, user is prompted: "Match found! Split this transaction?"
   - **Option A (Physical Split)**:
     - Delete original 40,910 transaction.
     - Create new transactions:
       - Purchase A: 4,160
       - Purchase B: 5,900
       - ...
   - **Option B (Logical Split)**:
     - Keep original transaction.
     - Add `sub_transactions` JSON to `source_raw_data`.
     - *Recommendation*: **Option A** is better for categorization. (e.g., Bread -> Food, Computer -> Device).

### 4.3. Schema Implications
- No major schema change needed if using Option A.
- Might need a `group_id` or `parent_id` in `transactions` table to track that these split items belong to one original payment.

## 5. Implementation Roadmap
1. **Refactor Parser**: Implement `SamsungCardProfile` and general adapter logic.
2. **Implement Cancellation Filter**: Add the pre-auth cleaning step in `parseExcel`.
3. **UI Update**: Show "Filtered/Ignored" count in the import result summary.
4. **Backend (Future)**: Build the Receipt OCR endpoint.

## 6. Data Mapping Strategy 🗺️

The system will automatically detect the bank format and transform the data as follows:

### 6.1. Automatic Detection
- User simply drops **any** supported file into the upload box.
- The `BankAdapter` logic scans the header row (e.g., checks for "카드번호" vs "거래후잔액").
- It selects the correct parser (Samsung, Hyundai, Kakao, etc.) automatically.

### 6.2. Field Mapping Table
We preserve **ALL** data. Core fields go to main columns, everything else goes to `source_raw_data` (JSON).

| Excel Column (Example) | Database Column (`transactions`) | Transformation Logic |
| :--- | :--- | :--- |
| `승인일자` (2026.02.15) | `date` (Timestamp) | Combined with Time to create full ISO string (e.g., `2026-02-15T18:26:29+09:00`) |
| `승인시각` (18:26:29) | (Merged above) | Used to create precise timestamp |
| `승인금액` (6,200) | `amount` (Number) | Parsed to integer. (Negative if Refund) |
| `가맹점명` (하모니마트) | `description` (Text) | Used as the main title/description |
| `승인번호` (91315092) | `source_raw_data` (JSON) | `{ "auth_code": "91315092", ... }` |
| `취소여부` (전체취소) | `source_raw_data` (JSON) | `{ "status": "cancelled", ... }` |
| `거래후잔액` (Kakao) | `source_raw_data` (JSON) | `{ "balance": 1837175, ... }` |
| (Original Row) | `source_raw_data` (JSON) | The full original row is saved for audit/debugging. |

> **Note**: Even though `2024-2025` data only had Dates, the new system will simply have `00:00:00` for those old records. New records will have precise times, allowing for accurate sorting and "Pre-auth" deduplication.
