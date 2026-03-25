import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { type CashflowInsight } from '@/entities/transaction/model/cashflow';
import { TrendingUp, TrendingDown, Wallet, Calculator } from 'lucide-react';

interface Props {
  data: CashflowInsight;
}

export function CashflowSummaryCards({ data }: Props) {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('ko-KR', { 
        style: 'currency', 
        currency: 'KRW',
        maximumFractionDigits: 0 
    }).format(amount);

  const businessNet = data.business_income - data.business_expense;
  const personalNet = data.personal_income - data.personal_expense;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-blue-600 dark:text-blue-400">비즈니스 순수익</CardTitle>
          <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-full">
            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{formatCurrency(businessNet)}</div>
          <p className="text-[10px] text-muted-foreground mt-1 flex justify-between">
            <span>수입: {formatCurrency(data.business_income)}</span>
            <span>지출: {formatCurrency(data.business_expense)}</span>
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-purple-600 dark:text-purple-400">입금 예정 (Pipeline)</CardTitle>
          <div className="bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded-full">
            <Calculator className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{formatCurrency(data.expected_income)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            현장 일당 미입금 합계
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">개인 가용 자금 (Net)</CardTitle>
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-1.5 rounded-full">
            <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{formatCurrency(personalNet)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            개인 수입 - 개인 지출
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-orange-600 dark:text-orange-400">총 지출</CardTitle>
          <div className="bg-orange-100 dark:bg-orange-900/30 p-1.5 rounded-full">
            <TrendingDown className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{formatCurrency(data.business_expense + data.personal_expense)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            비즈니스 + 개인 지출 총액
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
