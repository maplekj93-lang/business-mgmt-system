import React, { Suspense } from 'react';
import { cookies } from 'next/headers';
import { Header } from '@/widgets/layout/ui/header';
import { getAdvancedAnalytics } from '@/entities/analytics/api/get-analytics';
import { CategoryDonutChart } from '@/features/analytics/ui/category-donut-chart';
import { DailyTrendChart } from '@/features/analytics/ui/daily-trend-chart';
import { AnalyticsFilter } from '@/features/analytics/ui/analytics-filter';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { TrendingUp, CreditCard, Receipt } from 'lucide-react';

import { createClient } from '@/shared/api/supabase/server';

export default async function AnalyticsPage({
    searchParams
}: {
    searchParams: Promise<{ year?: string; month?: string }>
}) {
    const { year, month } = await searchParams;
    const cookieStore = await cookies();
    const appMode = (cookieStore.get('app-mode')?.value as 'personal' | 'total' | 'business') || 'personal';

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return (
            <div className="min-h-screen bg-transparent">
                <Header defaultMode={appMode} />
                <main className="container mx-auto p-6 flex items-center justify-center h-[calc(100vh-200px)]">
                    <p className="text-muted-foreground">데이터를 불러올 수 없거나 권한이 없습니다.</p>
                </main>
            </div>
        );
    }

    const selectedYear = year ? Number(year) : new Date().getFullYear();
    const selectedMonth = month ? Number(month) : new Date().getMonth() + 1;

    const analyticsData = await getAdvancedAnalytics({
        mode: appMode,
        year: selectedYear,
        month: selectedMonth
    });

    if (!analyticsData) {
        return (
            <div className="min-h-screen bg-transparent">
                <Header userEmail={user.email} defaultMode={appMode} />
                <main className="container mx-auto p-6 flex items-center justify-center h-[calc(100vh-200px)]">
                    <p className="text-muted-foreground">분석 데이터를 집계할 수 없습니다.</p>
                </main>
            </div>
        );
    }

    const { dailyTrend, categoryDistribution, summary } = analyticsData;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('ko-KR').format(val);
    };

    return (
        <div className="min-h-screen bg-transparent">
            {/* ✅ Header Integration (Constitution Article 5) */}
            <Header userEmail={user.email} defaultMode={appMode} />

            <main className="container mx-auto p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">
                        Finance Analytics
                    </h1>
                    <Suspense fallback={<div className="h-10 w-48 bg-white/5 animate-pulse rounded-lg" />}>
                        <AnalyticsFilter />
                    </Suspense>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="glass-panel border-border overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">총 수입</CardTitle>
                            <TrendingUp className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">+{formatCurrency(summary.total_income)}원</div>
                            <p className="text-xs text-muted-foreground mt-1">해당 월 누적 실적</p>
                        </CardContent>
                    </Card>
                    <Card className="glass-panel border-border overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">총 지출</CardTitle>
                            <CreditCard className="h-4 w-4 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">-{formatCurrency(summary.total_expense)}원</div>
                            <p className="text-xs text-muted-foreground mt-1">{summary.transaction_count}건의 거래 내역</p>
                        </CardContent>
                    </Card>
                    <Card className="glass-panel border-border overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">순수익</CardTitle>
                            <Receipt className="h-4 w-4 text-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(summary.total_income - summary.total_expense)}원
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">현금 흐름 수지</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Category Donut (1/3) */}
                    <div className="lg:col-span-1">
                        <CategoryDonutChart data={categoryDistribution} totalAmount={summary.total_expense} />
                    </div>

                    {/* Daily Trend (2/3) */}
                    <div className="lg:col-span-2">
                        <DailyTrendChart data={dailyTrend} />
                    </div>
                </div>

                {categoryDistribution.length === 0 && (
                    <Card className="glass-panel border-border p-12 text-center">
                        <p className="text-muted-foreground italic">선택한 기간의 데이터가 충분하지 않습니다.</p>
                    </Card>
                )}
            </main>
        </div>
    );
}
