"use client"

import * as React from "react"
import { Pie, PieChart, Cell, Label } from "recharts"

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
import { type CashflowInsight } from "@/entities/transaction/model/cashflow"

const chartConfig = {
  business: {
    label: "비즈니스 지출",
    color: "hsl(var(--chart-1))",
  },
  personal: {
    label: "개인 지출",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

interface Props {
  data: CashflowInsight;
}

export function ExpenseDoughnutChart({ data }: Props) {
  const chartData = [
    { name: "business", value: data.business_expense, fill: "var(--color-business)" },
    { name: "personal", value: data.personal_expense, fill: "var(--color-personal)" },
  ]

  const totalExpense = data.business_expense + data.personal_expense;
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('ko-KR', { 
        style: 'currency', 
        currency: 'KRW',
        notation: 'compact',
        maximumFractionDigits: 1 
    }).format(amount);

  return (
    <Card className="flex flex-col border-none bg-transparent shadow-none">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-lg font-bold">지출 내역 요약</CardTitle>
        <CardDescription>비즈니스 vs 개인 지출 비중</CardDescription>
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
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={8}
            >
               {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
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
                          {formatCurrency(totalExpense)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-[10px]"
                        >
                          총 지출액
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
