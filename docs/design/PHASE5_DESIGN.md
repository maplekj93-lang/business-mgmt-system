# 📊 Phase 5: Dashboard & Report Completion Design (Refined)

## 🎯 Objective
To finalize the financial command center by providing deep insights into personal spending, business profitability, and integrated net-worth growth. Phase 5 now prioritizes **Owner-Specific Intelligence** (Kwangjun vs Euiyoung) and **Tax-Adjusted Profitability**.

---

## 🏗️ 1. Personal Track: Spending & Net Worth
### [NEW] Category Distribution (Donut Chart)
- **Component:** `CategoryDonutChart`
- **Data:** Aggregated spending by top-level categories.
- **Filter:** Support filtering by Owner (Kwangjun / Euiyoung / Joint) to see individual spending habits.

### [NEW] Net Worth Evolution Chart
- **Component:** `NetWorthChart`
- **Goal:** Trend of (Assets - Liabilities) over the last 12 months.

---

## 💼 2. Business Track: Owner-Centric Profitability
### [NEW] Owner-Specific Dashboard Filter
- **UI:** Global toggle at the top of the Business Dashboard: `[전체 | 광준 | 의영]`.
- **Effect:** Filters all summary cards and project tables to show only the selected owner's data.

### [NEW] Project Profitability Summary (Tax-Adjusted)
- **Component:** `ProjectProfitabilityTable`
- **Logic:** 
  - `Gross Revenue` (Total Income)
  - `- VAT (10%)` (if applicable)
  - `- Crew Payments (Net)`
  - `- Site Expenses`
  - `- Allocated Transactions (Business overhead)`
  - **= `Net Profit`**
- **Columns:** Project Name, Owner, Gross, Net Profit, Margin (%).

---

## 📈 3. Integrated View (Total Integrated Wealth)
- Unified view showing Personal + Business consolidated flow.
- Balance tracker across all accounts.

---

## 📄 4. Monthly Reporting (The "Month in Review")
- **Route:** `/reports/monthly/[year]/[month]`
- **Sections:**
    - Executive Summary (Owner breakdown).
    - Top 5 Expenses (Personal/Business).
    - Profitability Highlights.

---

## 🛠️ 5. Technical Requirements
- Update `getMonthlyStats` & `getBusinessSummary` to accept `owner` parameter.
- Implement precision math for VAT and tax-adjusted profit.
