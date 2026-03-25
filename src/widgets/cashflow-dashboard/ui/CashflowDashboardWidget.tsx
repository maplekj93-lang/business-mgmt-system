"use client"

import React, { useState, useEffect } from 'react';
import { getCashflowStats } from '@/entities/transaction/api/get-cashflow-stats';
import { type CashflowInsight } from '@/entities/transaction/model/cashflow';
import { CashflowSummaryCards } from '@/features/cashflow-summary/ui/CashflowSummaryCards';
import { ExpenseDoughnutChart } from '@/features/cashflow-summary/ui/ExpenseDoughnutChart';
import { Skeleton } from '@/shared/ui/skeleton';
import { Button } from '@/shared/ui/button';
import { Calendar as CalendarIcon, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';

export function CashflowDashboardWidget() {
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    });
    const [data, setData] = useState<CashflowInsight | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getCashflowStats(
                format(dateRange.start, 'yyyy-MM-dd'),
                format(dateRange.end, 'yyyy-MM-dd')
            );
            if (result.success && result.data) {
                setData(result.data);
            } else {
                setError(result.error || '데이터를 가져오는데 실패했습니다.');
            }
        } catch (err) {
            setError('통신 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const handlePrevMonth = () => {
        const newStart = startOfMonth(subMonths(dateRange.start, 1));
        const newEnd = endOfMonth(newStart);
        setDateRange({ start: newStart, end: newEnd });
    };

    const handleNextMonth = () => {
        const newStart = startOfMonth(addMonths(dateRange.start, 1));
        const newEnd = endOfMonth(newStart);
        setDateRange({ start: newStart, end: newEnd });
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-destructive/5 rounded-3xl border border-destructive/20 text-destructive">
                <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                <p className="font-bold text-lg mb-2">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
                    <RefreshCw className="w-4 h-4" /> 다시 시도
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header / Date Control */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl font-black flex items-center gap-2 italic">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <CalendarIcon className="w-4 h-4 text-primary" />
                    </div>
                    통합 현금흐름 (Beta)
                </h2>
                <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-2xl border border-border/50 backdrop-blur-md">
                    <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 rounded-xl hover:bg-background/80">
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="px-4 text-sm font-black tracking-tighter">
                        {format(dateRange.start, 'yyyy. MM')}
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 rounded-xl hover:bg-background/80">
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-4">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-3xl" />)}
                    </div>
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Skeleton className="lg:col-span-1 h-[320px] rounded-3xl" />
                        <Skeleton className="lg:col-span-2 h-[320px] rounded-3xl" />
                    </div>
                </div>
            ) : data && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
                    <CashflowSummaryCards data={data} />
                    
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Summary Chart */}
                        <div className="lg:col-span-1 border border-border/40 bg-card/40 backdrop-blur-xl rounded-[2rem] p-4 shadow-sm">
                            <ExpenseDoughnutChart data={data} />
                        </div>

                        {/* Additional Insights Placeholder for Phase 2 */}
                        <div className="lg:col-span-2 tactile-panel p-8 flex flex-col items-center justify-center text-center bg-gradient-to-br from-primary/[0.03] to-transparent border-primary/10 rounded-[2rem]">
                            <div className="max-w-md">
                                <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <TrendingUp className="w-8 h-8 text-primary opacity-40" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">스마트 지출 브리핑 (Beta)</h3>
                                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                                    현재 데이터를 분석하여 지출 패턴을 파악 중입니다. <br />
                                    Phase 2에서 AI 기반 절약 가이드를 만나보세요.
                                </p>
                                <div className="flex justify-center gap-3 opacity-20 select-none grayscale">
                                    {[1, 2, 3, 4].map(i => <div key={i} className="w-16 h-2 bg-primary rounded-full" />)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
