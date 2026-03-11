import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { SummaryStats } from '@/entities/transaction/model/stats-schema';

export function SummaryCards({ data }: { data: SummaryStats }) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(val);
    };

    return (
        <div className="grid gap-4 md:grid-cols-3">
            {/* Total Income */}
            <div className="tactile-panel p-6 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">총 수입</span>
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <ArrowUpRight className="h-4 w-4 text-primary dark:text-blue-400" />
                    </div>
                </div>
                <div className="text-2xl font-bold text-primary dark:text-blue-400">
                    {formatCurrency(data.totalIncome)}
                </div>
            </div>

            {/* Total Expense */}
            <div className="tactile-panel p-6 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">총 지출</span>
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(data.totalExpense)}
                </div>
            </div>

            {/* Net Profit */}
            <div className="tactile-panel p-6 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">순수익</span>
                    <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                </div>
                <div className={cn(
                    "text-2xl font-bold",
                    data.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600"
                )}>
                    {formatCurrency(data.netProfit)}
                </div>
            </div>
        </div>
    );
}
