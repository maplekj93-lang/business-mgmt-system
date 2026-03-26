"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { getDailyRateLogs } from '@/entities/daily-rate/api/get-daily-logs'
import { getProjects } from '@/entities/project/api/get-projects'
import { Wallet, TrendingUp, Users, Briefcase, Loader2, HandCoins } from 'lucide-react'
import { RevenueAnalysis } from './RevenueAnalysis'
import { RecentCrew } from './RecentCrew'
import { QuickInfoFooter } from './QuickInfoFooter'
import { ProjectBriefList } from './ProjectBriefList'
import { VatReserveCard } from '@/widgets/vat-reserve-card/ui/VatReserveCard'
import { IncomeTaxReserveCard } from '@/widgets/income-tax-reserve-card/ui/IncomeTaxReserveCard'
import { SafetyNetCard } from '@/widgets/safety-net-card/ui/SafetyNetCard'
import { RecurringExpenseCard } from '@/widgets/recurring-expense-card'
import { RecurringExpenseCalendar } from '@/widgets/recurring-expense-calendar'
import { ReceivablesAlertCard } from '@/widgets/receivables-alert/ui/ReceivablesAlertCard'
import { getMonthlyStats, DashboardStats } from '@/entities/transaction/api/get-monthly-stats'
import { getBusinessSummary, BusinessSummary } from '@/entities/daily-rate/api/get-business-summary'
import { getUnsettledDutchPaySummary } from '@/entities/dutch-pay/api/get-dutch-pay'
import { getCashflowStats } from '@/entities/transaction/api/get-cashflow-stats'
import { CashflowInsight } from '@/entities/transaction/model/cashflow'
import { ActionCenterWidget } from '@/widgets/action-center'
import { MatchingHealthWidget } from '@/widgets/matching-health'
import { OwnerToggle } from '@/shared/ui/OwnerToggle'
import { OwnerType } from '@/shared/constants/business'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { ProjectProfitabilityTable } from './ProjectProfitabilityTable'
import { CategoryDonutChart } from './CategoryDonutChart'
import { ProfitBalanceCard } from './ProfitBalanceCard'
import { ProfitabilityAlert } from './ProfitabilityAlert'
import { getProjectAnalytics, ProjectProfitabilityData, CategoryDistribution } from '@/entities/project/api/get-project-analytics'
import { IncomeMatchingWidget } from '@/features/match-income/ui/IncomeMatchingWidget'

export function BusinessDashboard() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    
    // URL query param에서 ownerId 가져오기 (기본값 'all')
    const ownerId = (searchParams.get('owner') as OwnerType | 'all') || 'all'

    const [summary, setSummary] = useState<BusinessSummary | null>(null)
    const [monthlyStats, setMonthlyStats] = useState<DashboardStats | null>(null)
    const [dutchPayAmount, setDutchPayAmount] = useState<number>(0)
    const [cashflowStats, setCashflowStats] = useState<CashflowInsight | null>(null)
    const [profitability, setProfitability] = useState<ProjectProfitabilityData[]>([])
    const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([])
    const [loading, setLoading] = useState(true)

    const handleOwnerChange = (newOwner: OwnerType | 'all') => {
        const params = new URLSearchParams(searchParams)
        if (newOwner === 'all') {
            params.delete('owner')
        } else {
            params.set('owner', newOwner)
        }
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            try {
                const now = new Date()
                const startOfYear = `${now.getFullYear()}-01-01`
                const endOfYear = `${now.getFullYear()}-12-31`

                const [summaryResult, txStats, dpSummary, cfStats, analyticsResult] = await Promise.all([
                    getBusinessSummary(ownerId),
                    getMonthlyStats({ mode: 'business', ownerId }),
                    getUnsettledDutchPaySummary(),
                    getCashflowStats(startOfYear, endOfYear, ownerId),
                    getProjectAnalytics({ ownerId, mode: 'business' })
                ])
                if (summaryResult.success) {
                    setSummary(summaryResult.data)
                }
                setMonthlyStats(txStats)
                setDutchPayAmount(dpSummary.totalToReceive)
                if (cfStats.success && cfStats.data) {
                    setCashflowStats(cfStats.data)
                }
                if (analyticsResult.success) {
                    setProfitability(analyticsResult.data.profitability)
                    setCategoryDistribution(analyticsResult.data.categoryDistribution)
                }
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [ownerId])

    if (loading || !summary) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white mb-1">비즈니스 대시보드</h2>
                    <p className="text-xs text-slate-500 font-medium">실시간 사업 현황 및 수익성 분석</p>
                </div>
                <OwnerToggle value={ownerId} onChange={handleOwnerChange} />
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {/* Profit Balance Card (Visible only in 'all' view) */}
                {ownerId === 'all' ? (
                    <ProfitBalanceCard projects={profitability} />
                ) : (
                    /* Dashboard Stats Card as a placeholder or specific owner info */
                    <div className="group relative overflow-hidden rounded-2xl bg-background p-6 transition-all hover:bg-slate-900/60">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">수익률(평균)</p>
                            <div className="rounded-xl bg-primary/10 p-2.5 text-primary shadow-sm ring-1 ring-primary/20">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline gap-1">
                            <h3 className="text-3xl font-black tracking-tight text-white">
                                {profitability.length > 0 
                                    ? (profitability.reduce((sum, p) => sum + p.profit_margin, 0) / profitability.length).toFixed(1)
                                    : '0.0'
                                }
                            </h3>
                            <span className="text-sm font-semibold text-slate-500">%</span>
                        </div>
                    </div>
                )}

                {/* Active Projects */}
                <div className="group relative overflow-hidden rounded-2xl bg-background p-6 transition-all hover:bg-slate-900/60 hover: hover:shadow-primary/20">
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">진행중인 프로젝트</p>
                        <div className="rounded-xl bg-primary/10 p-2.5 text-primary shadow-sm ring-1 ring-primary/20">
                            <Briefcase className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                        <h3 className="text-3xl font-black tracking-tight text-white">{summary.active_projects_count}</h3>
                        <span className="text-sm font-semibold text-slate-500">건</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded">
                            <TrendingUp className="h-3 w-3" />
                            LIVE
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">현재 활성화됨</span>
                    </div>
                </div>

                {/* Monthly Revenue */}
                <div className="group relative overflow-hidden rounded-2xl bg-background p-6 transition-all hover:bg-slate-900/60 hover: hover:shadow-emerald-500/20">
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl transition-all group-hover:bg-emerald-500/20" />
                    <div className="flex items-center justify-between" title="이달의 총 수입 (캐시플로우 기반)">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">이달의 매출</p>
                        <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500 shadow-sm ring-1 ring-emerald-500/20">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-lg font-bold text-slate-500">₩</span>
                        <h3 className="text-3xl font-black tracking-tight text-white">{(monthlyStats?.totalIncome || 0).toLocaleString()}</h3>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded">
                            <TrendingUp className="h-3 w-3" />
                            REAL-TIME
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">입금 확인액</span>
                    </div>
                </div>

                {/* Pending Payments */}
                <div className="group relative overflow-hidden rounded-2xl bg-background p-6 transition-all hover:bg-slate-900/60 hover: hover:shadow-amber-500/20">
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl transition-all group-hover:bg-amber-500/20" />
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">미결제 내역</p>
                        <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500 shadow-sm ring-1 ring-amber-500/20">
                            <Wallet className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                        <h3 className="text-3xl font-black tracking-tight text-white">{summary.pending_logs_count}</h3>
                        <span className="text-sm font-semibold text-slate-500">건</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center gap-1 text-rose-400 text-[10px] font-bold bg-rose-400/10 px-1.5 py-0.5 rounded">
                            미수금
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">현장 기록 기반</span>
                    </div>
                </div>

                {/* Crew Expense (Unpaid) */}
                <div className="group relative overflow-hidden rounded-2xl bg-background p-6 transition-all hover:bg-slate-900/60 hover: hover:shadow-rose-500/20">
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-rose-500/10 blur-2xl transition-all group-hover:bg-rose-500/20" />
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">미지급 인건비</p>
                        <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-500 shadow-sm ring-1 ring-rose-500/20">
                            <Users className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-lg font-bold text-slate-500">₩</span>
                        <h3 className="text-3xl font-black tracking-tight text-white">{summary.unpaid_crew_amount.toLocaleString()}</h3>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold bg-white/5 px-1.5 py-0.5 rounded">
                            WAITING
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">송금 대기 중</span>
                    </div>
                </div>

                {/* Dutch Pay Unsettled */}
                <div className="group relative overflow-hidden rounded-2xl bg-background p-6 transition-all hover:bg-slate-900/60 hover: hover:shadow-orange-500/20">
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl transition-all group-hover:bg-orange-500/20" />
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">미정산 더치페이</p>
                        <div className="rounded-xl bg-orange-500/10 p-2.5 text-orange-500 shadow-sm ring-1 ring-orange-500/20">
                            <HandCoins className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-lg font-bold text-slate-500">₩</span>
                        <h3 className="text-3xl font-black tracking-tight text-white">{dutchPayAmount.toLocaleString()}</h3>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center gap-1 text-orange-400 text-[10px] font-bold bg-orange-500/10 px-1.5 py-0.5 rounded transition-all group-hover:bg-orange-500/20">
                            RECEIVABLE
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium font-bold tracking-tight">받아야 할 정산금</span>
                    </div>
                </div>
            </div>

            <ProfitabilityAlert projects={profitability} />

            {/* Main Content: Chart & Projects & Crew */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <IncomeMatchingWidget />
                    <ReceivablesAlertCard />
                    {cashflowStats && (
                        <MatchingHealthWidget 
                            pendingCount={cashflowStats.pending_count || 0} 
                            totalCount={cashflowStats.total_count || 0} 
                        />
                    )}
                    <RevenueAnalysis data={monthlyStats?.trend || []} />
                </div>
                <div className="space-y-6">
                    <ProjectBriefList />
                    <CategoryDonutChart data={categoryDistribution} />
                </div>
                <div className="space-y-6">
                    <ActionCenterWidget />
                    <RecentCrew />
                </div>
            </div>

            {/* Phase 5 Analytics Level */}
            <div className="grid grid-cols-1 gap-6">
                <ProjectProfitabilityTable projects={profitability} />
            </div>

            {/* Sub-widgets Level */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <VatReserveCard />
                </div>
                <div className="lg:col-span-1">
                    <IncomeTaxReserveCard />
                </div>
                <div className="lg:col-span-1">
                    <SafetyNetCard />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <RecurringExpenseCard />
                </div>
                <div className="lg:col-span-2">
                    <RecurringExpenseCalendar />
                </div>
            </div>

            {/* Quick Info Footer */}
            <QuickInfoFooter summary={summary} />
        </div>
    )
}
