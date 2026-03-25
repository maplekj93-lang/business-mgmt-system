# Changelog

All notable changes to this project will be documented in this file.

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
