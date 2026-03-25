# Research: Ledger Integrity & Grouping Enhancements (2026-03-11)

## 1. '가승인' (Pre-auth) Issue
### Observations
- Description: "카카오T택시_가승인"
- Pattern: Multiple ± transactions that often net to zero.
- User Request: Remove existing data and prevent future imports.
### Root Cause
- The `applyNetZeroFilter` in `parser.ts` attempts to match pairs, but "가승인" pattern might involve more than 2 transactions or non-matching auth codes.
- It is safer and requested by the user to explicitly ignore any transaction with "가승인" in the description.

## 2. '기브온' (Gibeon) Expenditure Error
### Observations
- Description: "주식회사기브온"
- Issue: Shown as expense (-6,198,500 KRW), but user says no such payment was made. Likely income misidentified as expense.
### Root Cause
- In `parseBankSheet` and `parseLegacySheet`, if the column mapping for 'income' fails or is missing, transactions default to 'expense' (negative).
- If "기브온" was a deposit, and the parser didn't find the '입금' column correctly, it flipped the amount to negative.

## 3. Mixed Income/Expense Grouping
### Observations
- User finds it confusing when spending and cancellations/returns are grouped together.
### Root Cause
- The `get_unclassified_stats` RPC groups by `(raw_name, owner_type)`.
- If a merchant (e.g., Coupang) has both a purchase (-30,000) and a return (+30,000), they are grouped, showing a total of 0.
- User wants them separated to clarify the action.

## 4. Generic "Uncategorized" Grouping
- (Previously identified) RPC groups disparate merchants under "Uncategorized" because the parser uses it as a default category tag.

---

## Proposed Remediation Plan
1.  **Cleanup**: SQL script to delete all transactions where `description` includes '가승인'.
2.  **Parser Fix (parser.ts)**:
    *   Explicitly skip rows if description contains '가승인'.
    *   Refine legacy parser heuristics to better distinguish income vs. expense.
3.  **RPC Fix (get_unclassified_stats)**:
    *   Update `raw_name` to handle 'Uncategorized' fallback (priority: merchant description).
    *   **Add `type` to `GROUP BY`** to separate Income and Expense groups for the same merchant.
