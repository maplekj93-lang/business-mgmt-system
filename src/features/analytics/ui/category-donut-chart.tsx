'use client'

import * as React from "react"
import { Label, Pie, PieChart, Cell } from "recharts"
import { CategoryDistribution } from "@/entities/analytics/model/types"
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

interface CategoryDonutChartProps {
    data: CategoryDistribution[];
    totalAmount: number;
}

export function CategoryDonutChart({ data, totalAmount }: CategoryDonutChartProps) {
    // Dynamically generate chart config from data
    const chartConfig = React.useMemo(() => {
        const config: ChartConfig = {
            value: { label: "금액" }
        };
        data.forEach((item, index) => {
            config[item.name] = {
                label: item.name,
                color: `hsl(var(--chart-${(index % 5) + 1}))`,
            };
        });
        return config;
    }, [data]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('ko-KR').format(val);
    };

    return (
        <Card className="flex flex-col glass-panel border-border h-full">
            <CardHeader className="items-center pb-0">
                <CardTitle>지출 분포</CardTitle>
                <CardDescription>카테고리별 지출 비중</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[250px]"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            strokeWidth={5}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={chartConfig[entry.name]?.color}
                                    className="stroke-background hover:opacity-80 transition-opacity"
                                />
                            ))}
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="fill-foreground text-xl font-bold"
                                                >
                                                    {formatCurrency(totalAmount)}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                    className="fill-muted-foreground text-xs"
                                                >
                                                    총 지출
                                                </tspan>
                                            </text>
                                        )
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
