'use client'

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { DailyTrend } from "@/entities/analytics/model/types"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/shared/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/shared/ui/chart"

const chartConfig = {
    income: {
        label: "수입",
        color: "hsl(var(--chart-2))", // Green-ish
    },
    expense: {
        label: "지출",
        color: "hsl(var(--chart-5))", // Red-ish
    },
} satisfies ChartConfig

interface DailyTrendChartProps {
    data: DailyTrend[];
}

export function DailyTrendChart({ data }: DailyTrendChartProps) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('ko-KR').format(val);
    };

    return (
        <Card className="glass-panel border-border h-full">
            <CardHeader>
                <CardTitle>일별 추이</CardTitle>
                <CardDescription>
                    수입과 지출의 일별 실적 변화를 시각화합니다.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                    <AreaChart
                        accessibilityLayer
                        data={data}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.split('-')[2]} // Show only day
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Area
                            dataKey="income"
                            type="monotone"
                            fill="var(--color-income)"
                            fillOpacity={0.1}
                            stroke="var(--color-income)"
                            stackId="a"
                        />
                        <Area
                            dataKey="expense"
                            type="monotone"
                            fill="var(--color-expense)"
                            fillOpacity={0.1}
                            stroke="var(--color-expense)"
                            stackId="a"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
