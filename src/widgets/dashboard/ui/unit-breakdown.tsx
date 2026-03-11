'use client';

import { SummaryStats } from '@/entities/transaction/model/stats-schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Progress } from "../../../shared/ui/progress"; // Fixed: relative import to bypass potential alias caching issues

interface UnitBreakdownProps {
    data: SummaryStats;
}

export function UnitBreakdown({ data }: UnitBreakdownProps) {
    if (!data.unitBreakdown || data.unitBreakdown.length === 0) {
        return (
            <Card className="tactile-panel">
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Business Unit Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground italic">No business unit data available.</p>
                </CardContent>
            </Card>
        );
    }

    // 전체 순수익 합계 계산 (분모용)
    const totalBusinessNet = data.unitBreakdown.reduce((acc, curr) => acc + curr.net, 0);

    return (
        <Card className="tactile-panel">
            <CardHeader>
                <CardTitle className="text-sm font-medium">Business Unit Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {data.unitBreakdown.map((unit) => {
                    // 순수익 기여도 계산 (음수일 경우 0% 처리하여 UI 깨짐 방지)
                    const percentage = totalBusinessNet > 0
                        ? Math.max(0, Math.min(100, (unit.net / totalBusinessNet) * 100))
                        : 0;

                    return (
                        <div key={unit.unit_name} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold">{unit.unit_name}</span>
                                <span className={unit.net >= 0 ? 'text-primary' : 'text-destructive'}>
                                    {new Intl.NumberFormat('ko-KR').format(unit.net)}원
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Progress value={percentage} className="h-2 flex-1" />
                                <span className="text-[10px] text-muted-foreground w-8 text-right">
                                    {Math.round(percentage)}%
                                </span>
                            </div>

                            <div className="flex justify-between text-[10px] text-muted-foreground opacity-70">
                                <span>In: {new Intl.NumberFormat('ko-KR').format(unit.income)}</span>
                                <span>Out: {new Intl.NumberFormat('ko-KR').format(unit.expense)}</span>
                            </div>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    );
}
