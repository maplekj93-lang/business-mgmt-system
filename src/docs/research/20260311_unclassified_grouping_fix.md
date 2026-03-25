# Research: Unclassified Inbox Grouping Issue

## Problem
In the "Unclassified Inbox" (미분류 수신함), multiple disparate transactions (e.g., Coupang, GS25, Apple) are being grouped under a single "Uncategorized" header. 
This makes it impossible for the user to categorize them individually using the bulk assignment feature, as any action applies to the entire group.

## Root Cause Analysis
1.  **Ledger Parser**: When transactions are imported via `src/features/ledger-import/model/parser.ts`, the `categoryRaw` (saved as `original_category` in metadata) defaults to `"Uncategorized"` if no specific category is identified from the source file.
2.  **Database RPC**: The `get_unclassified_stats` RPC (defined in `20260305_fix_unclassified_stats_rpc.sql`) groups transactions using the following logic:
    ```sql
    COALESCE(source_raw_data->>'original_category', description, 'Unknown') as raw_name
    ...
    GROUP BY 1, 3
    ```
3.  **Grouping Failure**: Since many transactions share the same `"Uncategorized"` value in `original_category`, they are all grouped into one row, regardless of their `description`.

## Proposed Solution
Modify the RPC `get_unclassified_stats` to prioritize the `description` (merchant name) for grouping when the `original_category` is the generic `"Uncategorized"` string.

### Revised Logic for `raw_name`
```sql
COALESCE(
  NULLIF(source_raw_data->>'original_category', 'Uncategorized'), 
  description, 
  'Unknown'
) as raw_name
```
This ensures that if `original_category` is either NULL or `"Uncategorized"`, the `description` is used for grouping.

## Expected Outcome
- Transactions from different merchants will appear as separate rows in the Unclassified Inbox.
- Multiple transactions from the *same* merchant (e.g., 5 Coupang orders) will still be grouped together, which is the desired behavior for bulk categorization.
