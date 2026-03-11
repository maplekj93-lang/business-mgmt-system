---
activation: model_decision
description: >
  Load this rule when the task involves ERP features: business profiles, clients,
  projects, project_incomes, daily_rate_logs, crew_payments, site_expenses,
  kanban pipeline, or /business/* routes.
---

# ERP Phase 4 — Task Context

> Full spec: `docs/handover/WORK_ORDER_ERP_PHASE4.md`

## What's Already Built (Do Not Touch)

| Area | Content |
|------|---------|
| DB | `assets`, `transactions`, `mdt_categories`, `business_units`, `profiles` |
| DB | `transactions.project_id` FK (references existing `projects` table) |
| entities | `asset/`, `transaction/`, `category/`, `analytics/`, `business/` |
| features | `ledger-import/`, `manage-categories/`, `refine-ledger/`, `auth/`, `allocate-transaction/` |
| widgets | `dashboard/`, `layout/`, `transaction-history/` |
| pages | `/`, `/analytics`, `/manage/import`, `/settings/*`, `/transactions/unclassified` |

## What to Build in Phase 4

| Area | Content |
|------|---------|
| DB (new) | `business_profiles`, `clients`, `project_incomes`, `daily_rate_logs`, `crew_payments`, `site_expenses` |
| DB (replace) | existing `projects` table → ERP spec (⚠️ FK migration required) |
| entities | `client/`, `project/` (replace), `daily-rate/` |
| features | `manage-business-profile/`, `manage-pipeline/`, `log-daily-rate/`, `calculate-tax/`, `manage-crew/` |
| widgets | `income-kanban/`, `business-dashboard/`, `client-list/`, `cashflow-calendar/` |
| pages | `/business/*` (all new routes) |

## Critical Warnings

1. **`projects` table conflict** — Current schema is incompatible with ERP design. Follow Step 1-B migration order exactly (FK drop → DROP TABLE → recreate → FK restore).
2. **`src/entities/business/`** — Do not touch. It's for `business_units`, not `business_profiles`.
3. **`database.types.ts`** — Must regenerate via CLI after every migration. Never edit manually.

## Migration Execution Order

```
① Step 1-A: business_profiles, clients (no dependencies)
② Step 1-B: projects replacement (FK handling required)
③ Step 1-C: project_incomes, daily_rate_logs, crew_payments, site_expenses
④ Step 1-D: RLS policies
⑤ Step 1-E: Seed data
⑥ Step 2:   Regenerate database.types.ts
⑦ Steps 3-7: Code implementation
```

## Key Business Rules

- `daily_rate_logs.withholding_rate` DEFAULT **0** — Kwangjun issues tax invoice, no withholding
- `crew_payments.withholding_rate` DEFAULT **3.3** — 3.3% applied to crew payments
- `amount_net` — GENERATED ALWAYS AS column in both tables (never set manually)
- Pipeline statuses (order matters): 의뢰중 → 작업중 → 보류취소 → 작업완료 → 수정완료 → 입금대기 → 입금완료 → 포스팅완료
