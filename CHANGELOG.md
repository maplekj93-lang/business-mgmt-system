# Changelog

All notable changes to this project will be documented in this file.

## [0.2.2] - 2026-03-26

### Added
- **Import Engine Improvements**: Enhanced race condition prevention using `import_hash` and `ignoreDuplicates` at the database level.
- **Advanced Classification**: Implemented sophisticated category suggestion logic based on historical patterns and confidence scoring.
- **ERP Matching Widgets**: Added new widgets for `DailyRateLogs` and `SiteExpenses` matching in the Phase 5 dashboard.

### Fixed
- **Logic Bug**: Fixed `skipped` transaction count calculation when import chunks encounter errors.
- **Test Integrity**: Refactored Supabase mocks in test suites for better stability and chained method support.

## [0.2.1] - 2026-03-26

### Added
- **Phase 4 ERP Schema**: New database tables for business profiles, clients, projects, project incomes, daily rate logs, crew payments, and site expenses with complete RLS policies and seed data.
- **Income Reconciliation**: Enhanced income matching with dedicated migration for transaction-income linking logic.
- **Matching Rule Management**: New entity layer and feature module for managing custom categorization rules with visual scenario editors.
- **Income Matching Widget**: Enhanced matching dialog with improved UX, pending income querying, and match statistics.
- **Documentation Suite**: Comprehensive Phase 3-4 implementation guides, technical specifications, troubleshooting guides, and research summaries.

### Changed
- Regenerated TypeScript types from updated Supabase schema.
- Enhanced MatchIncomeDialog with advanced matching and transaction linking.
- Updated business dashboard with matching statistics header and rule management routes.
- Expanded STRUCTURE.md with detailed FSD architecture guidance.

### Fixed
- Transaction API endpoints (`get-cashflow-stats`, `get-monthly-stats`) for accurate statistical calculations.

## [0.2.0] - 2026-03-26

### Added
- **Business Dashboard**: New `ProfitBalanceCard` and `ProfitabilityAlert` components for real-time financial tracking.
- **Advanced Analytics**: Enhanced `AdvancedAnalytics` with owner-specific filtering and project profitability views.
- **Reporting**: SSR-based monthly report pages with print functionality and margin calculations.
- **Database**: 
  - Owner-specific filtering in `get_dashboard_stats`, `get_advanced_analytics`, and `calculate_cashflow_stats` RPCs.
  - New migrations for project linkage fixes and profitability analysis.

### Fixed
- **Next.js 15**: Resolved asynchronous `params` access errors in route handlers.
- **Hydration**: Fixed client/server component boundary issues in reporting pages.
- **Business Logic**: Handled zero-revenue cases in margin calculations to prevent `NaN%` display.

## [0.1.0] - 2026-03-24
- Initial release with core ERP features.
