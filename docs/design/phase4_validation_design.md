# Design: ERP Phase 4 Validation Strategy

## 1. Overview
This design outlines the approach for validating the database migration and ensuring no regressions in existing features during the transition to Phase 4 (Business/ERP).

## 2. Validation Components

### 2.1 Database Schema (Direct Inspection)
- Use `supabase-mcp-server` to list tables and columns.
- Compare actual schema against the Phase 4 specification in `erp-phase4.md` and `TASK_VALIDATE_DB_AND_REGRESSION.json`.
- Verify Foreign Key (FK) integrity for `transactions.project_id`.

### 2.2 Functional Behavior (SQL Testing)
- Execute `INSERT` statements to verify `GENERATED ALWAYS AS` columns (`amount_net`) in `daily_rate_logs` and `crew_payments`.
- Verify RLS (Row Level Security) settings via `pg_tables` or direct policy inspection.

### 2.3 UI Regression (Browser Testing)
- Manual/Automated walkthrough of existing routes:
  - Finance Dashboard (`/`)
  - Ledger Import (`/manage/import`)
  - Transaction History (`/transactions/history`)
  - Unclassified Transactions (`/transactions/unclassified`)
  - Settings Subpages (`/settings/*`)
  - Project Center (`/business/projects`)

### 2.4 Type Synchronization
- Execute Supabase CLI command to regenerate `src/shared/api/supabase/database.types.ts`.
- Perform a build check (`npm run build` or `tsc`) to ensure no type mismatches in existing code.

## 3. Reporting
- A final validation report will be generated following the template in the task JSON.
