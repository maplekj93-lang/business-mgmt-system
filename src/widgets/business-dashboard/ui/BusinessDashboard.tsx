"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { getDailyRateLogs } from '@/entities/daily-rate/api/get-daily-logs'
import { getProjects } from '@/entities/project/api/get-projects'
import { Wallet, TrendingUp, Users, Briefcase, Loader2 } from 'lucide-react'
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

export function BusinessDashboard() {
    const [summary, setSummary] = useState<BusinessSummary | null>(null)
    const [monthlyStats, setMonthlyStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            try {
                const [summaryData, txStats] = await Promise.all([
                    getBusinessSummary(),
                    getMonthlyStats({ mode: 'business' })
                ])
                setSummary(summaryData)
                setMonthlyStats(txStats)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    if (loading || !summary) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
            </div>

            {/* Main Content: Chart & Projects & Crew */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <ReceivablesAlertCard />
                    <RevenueAnalysis data={monthlyStats?.trend || []} />
                </div>
                <div>
                    <ProjectBriefList />
                </div>
                <div>
                    <RecentCrew />
                </div>
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
