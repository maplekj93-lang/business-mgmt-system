import { cookies } from 'next/headers';
import { getMonthlyStats } from '@/entities/transaction/api/get-monthly-stats';
import { SummaryCards } from './summary-cards';
import { TrendChart } from './trend-chart';
import { UnitBreakdown } from './unit-breakdown';

// Allow viewMode to be passed as prop (for future filtering support)
export async function DashboardWidget({ viewMode = 'all' }: { viewMode?: 'personal' | 'business' | 'all' }) {
    const stats = await getMonthlyStats();

    const cookieStore = await cookies();
    const appMode = (cookieStore.get('app-mode')?.value as 'personal' | 'total' | 'business') || 'personal';

    if (!stats) {
        return (
            <div className="w-full max-w-4xl mx-auto p-12 glass-panel text-center space-y-4">
                <h3 className="text-xl font-bold">Please sign in to view your financial data.</h3>
                <p className="text-muted-foreground text-sm">Your session may have expired or you are not logged in.</p>
                {/* Future: Add Login Button here */}
            </div>
        );
    }

    const dashboardTitle = appMode === 'business'
        ? 'Business Operations'
        : appMode === 'total'
            ? 'Integrated Wealth Flow'
            : 'Personal Dashboard';

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-8">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {dashboardTitle}
                </h2>
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${appMode === 'business' ? 'bg-indigo-500/20 text-indigo-300'
                            : appMode === 'total' ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-primary/10 text-primary'
                        }`}>
                        {appMode.toUpperCase()} VIEW
                    </span>
                </div>
            </div>

            <SummaryCards data={stats} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <TrendChart data={stats} />
                </div>
                <div>
                    {(appMode === 'business' || appMode === 'total') && <UnitBreakdown data={stats} />}
                </div>
            </div>
        </div>
    );
}
