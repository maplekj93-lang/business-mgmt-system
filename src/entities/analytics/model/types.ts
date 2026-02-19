export interface DailyTrend {
    date: string;
    income: number;
    expense: number;
}

export interface CategoryDistribution {
    name: string;
    value: number;
    color: string;
    icon: string;
}

export interface AnalyticsSummary {
    total_income: number;
    total_expense: number;
    transaction_count: number;
}

export interface AnalyticsData {
    dailyTrend: DailyTrend[];
    categoryDistribution: CategoryDistribution[];
    summary: AnalyticsSummary;
}
