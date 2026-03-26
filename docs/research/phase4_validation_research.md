# Research: ERP Phase 4 DB & Regression Validation

## 1. Database Schema Verification

### 1.1 New Tables Existence
- [x] `business_profiles`
- [x] `clients`
- [x] `projects` (Replaced with ERP spec)
- [x] `project_incomes`
- [x] `daily_rate_logs`
- [x] `crew_payments`
- [x] `site_expenses`

### 1.2 `projects` Table Schema
- [x] `client_id` (uuid, FK to clients)
- [x] `business_owner` (check: kwangjun, euiyoung, joint)
- [x] `income_type` (check: freelance, daily_rate, photo_project)
- [x] `categories` (text[])
- [x] `status` (check: active, completed, cancelled)
- [x] `duration_days` (numeric)
- [x] `start_date`, `end_date` (date)

### 1.3 Foreign Key Constraints
- [x] `transactions.project_id` references `projects.id`

### 1.4 RLS Policies
- [x] All 7 new tables have RLS enabled.

### 1.5 Seed Data
- [x] `business_profiles`: 3 rows
- [x] `clients`: 4 rows

### 1.6 Generated Columns (`amount_net`)
- [x] `daily_rate_logs`: Verified `amount_net` reflects `amount_gross` when `withholding_rate` is 0.
- [ ] `crew_payments`: To be verified with 3.3% rate.

## 2. Regression Testing (UI)

- [x] Dashboard Rendering (`/`): **PASS** (Normal rendering, summary cards OK)
- [x] Excel Import (`/manage/import`): **PASS** (Upload area and asset guide OK)
- [x] Unclassified Transactions (`/transactions/unclassified`): **PASS** (Reassignment logic OK)
- [x] Transaction History (`/transactions/history`): **PASS** (Table rendering OK, next.js searchParams warning noted)
- [x] Settings Pages (`/settings/*`): **PASS** (Categories, Assets, Recurring pages OK)
- [x] Existing Projects List (`/business/projects`): **PASS** (Data rendering OK. NOTE: Path changed from `/dashboard/business/projects` to `/business/projects`)

---

## 3. Discrepancies & Issues
- **Path Change**: The task JSON referred to `/dashboard/business/projects`, but the actual route is `/business/projects`.
- **Search Params Warning**: `/transactions/history` shows a Next.js console warning about synchronous `searchParams` access, but doesn't break functionality.
