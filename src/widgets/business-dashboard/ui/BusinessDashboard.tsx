"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { getDailyRateLogs } from '@/entities/daily-rate/api/get-daily-logs'
import { getProjects } from '@/entities/project/api/get-projects'
import { Wallet, TrendingUp, Users, Briefcase, Loader2 } from 'lucide-react'
import { RevenueAnalysis } from './RevenueAnalysis'
import { RecentCrew } from './RecentCrew'
import { QuickInfoFooter } from './QuickInfoFooter'
import { getMonthlyStats, DashboardStats } from '@/entities/transaction/api/get-monthly-stats'

export function BusinessDashboard() {
    const [stats, setStats] = useState({
        activeProjects: 0,
        monthlyRevenue: 0,
        pendingPayments: 0,
        crewCost: 0
    })
    const [trendData, setTrendData] = useState<DashboardStats['trend']>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadStats() {
            setLoading(true)
            try {
                const now = new Date()
                const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

                // Fetch basic stats and trend data in parallel
                const [projects, logs, monthlyStats] = await Promise.all([
                    getProjects('active'),
                    getDailyRateLogs(currentMonth),
                    getMonthlyStats()
                ])

                const revenue = logs.reduce((acc, log) => acc + log.amount_gross, 0)
                const crew = logs.reduce((acc, log) => {
                    return acc + (log.crew_payments?.reduce((s, c) => s + c.amount_gross, 0) || 0)
                }, 0)

                setStats({
                    activeProjects: projects.length,
                    monthlyRevenue: revenue,
                    pendingPayments: logs.filter(l => l.payment_status === 'pending').length,
                    crewCost: crew
                })

                if (monthlyStats) {
                    setTrendData(monthlyStats.trend)
                }
            } finally {
                setLoading(false)
            }
        }
        loadStats()
    }, [])

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Active Projects */}
                <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl transition-all hover:bg-slate-900/60 hover:shadow-2xl hover:shadow-primary/20">
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Projects</p>
                        <div className="rounded-xl bg-primary/10 p-2.5 text-primary shadow-sm ring-1 ring-primary/20">
                            <Briefcase className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                        <h3 className="text-3xl font-black tracking-tight text-white">{stats.activeProjects}</h3>
                        <span className="text-sm font-semibold text-slate-500">units</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded">
                            <TrendingUp className="h-3 w-3" />
                            +2 New
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">vs last week</span>
                    </div>
                </div>

                {/* Monthly Revenue */}
                <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl transition-all hover:bg-slate-900/60 hover:shadow-2xl hover:shadow-emerald-500/20">
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl transition-all group-hover:bg-emerald-500/20" />
                    <div className="flex items-center justify-between" title="월간 매출 총액 (세전)">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monthly Revenue</p>
                        <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500 shadow-sm ring-1 ring-emerald-500/20">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-lg font-bold text-slate-500">₩</span>
                        <h3 className="text-3xl font-black tracking-tight text-white">{stats.monthlyRevenue.toLocaleString()}</h3>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded">
                            <TrendingUp className="h-3 w-3" />
                            +12.4%
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">vs last month</span>
                    </div>
                </div>

                {/* Pending Payments */}
                <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl transition-all hover:bg-slate-900/60 hover:shadow-2xl hover:shadow-amber-500/20">
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl transition-all group-hover:bg-amber-500/20" />
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Payments</p>
                        <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500 shadow-sm ring-1 ring-amber-500/20">
                            <Wallet className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                        <h3 className="text-3xl font-black tracking-tight text-white">{stats.pendingPayments}</h3>
                        <span className="text-sm font-semibold text-slate-500">items</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center gap-1 text-rose-400 text-[10px] font-bold bg-rose-400/10 px-1.5 py-0.5 rounded">
                            Action Needed
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">requires review</span>
                    </div>
                </div>

                {/* Crew Cost */}
                <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl transition-all hover:bg-slate-900/60 hover:shadow-2xl hover:shadow-rose-500/20">
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-rose-500/10 blur-2xl transition-all group-hover:bg-rose-500/20" />
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Crew Expenses</p>
                        <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-500 shadow-sm ring-1 ring-rose-500/20">
                            <Users className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-lg font-bold text-slate-500">₩</span>
                        <h3 className="text-3xl font-black tracking-tight text-white">{stats.crewCost.toLocaleString()}</h3>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold bg-white/5 px-1.5 py-0.5 rounded">
                            -5.2%
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">optimized</span>
                    </div>
                </div>
            </div>

            {/* Main Content: Chart & Crew */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <RevenueAnalysis data={trendData} />
                </div>
                <div>
                    <RecentCrew />
                </div>
            </div>

            {/* Quick Info Footer */}
            <QuickInfoFooter />
        </div>
    )
}
