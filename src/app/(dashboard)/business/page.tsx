"use client"

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card'

import { BusinessDashboard } from '@/widgets/business-dashboard/ui/BusinessDashboard'
import { IncomeKanban } from '@/widgets/income-kanban/ui/IncomeKanban'
import { CashflowCalendar } from '@/widgets/cashflow-calendar/ui/CashflowCalendar'
import { BusinessProfileSettings } from '@/features/manage-business-profile'
import { LogDailyRateModal } from '@/features/log-daily-rate/ui/LogDailyRateModal'
import { DailyRateTable } from '@/features/manage-daily-rate/ui/DailyRateTable'
import { Button } from '@/shared/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import Link from 'next/link'
import { Plus, LayoutGrid, Settings, Wallet2, FolderOpen } from 'lucide-react'

export default function BusinessPage() {
    const router = useRouter()
    const [isLogModalOpen, setIsLogModalOpen] = useState(false)
    const [dashboardKey, setDashboardKey] = useState(0)
    const [tableRefreshKey, setTableRefreshKey] = useState(0)

    const handleLogSuccess = useCallback(() => {
        setIsLogModalOpen(false)
        setDashboardKey(k => k + 1)     // BusinessDashboard 리마운트 → 최신 데이터 재조회
        setTableRefreshKey(k => k + 1)  // DailyRateTable 데이터 재조회
        router.refresh()                // 서버 컴포넌트 캐시 무효화
    }, [router])

    return (
        <div className="flex flex-col gap-10 p-4 md:p-8 max-w-7xl mx-auto pb-20">
            {/* Header Area */}
            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-border/40">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="h-1 w-8 rounded-full bg-blue-600" />
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Management Suite</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Business Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium">사업체 통합 관리 및 실시간 수입 파이프라인</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" asChild className="rounded-xl border-border/60 hover:bg-secondary/80 h-11 px-5 shadow-sm">
                        <Link href="/business/projects">
                            <FolderOpen className="mr-2 h-4.5 w-4.5 text-blue-500" /> 프로젝트 센터
                        </Link>
                    </Button>
                    <Button
                        onClick={() => setIsLogModalOpen(true)}
                        className="rounded-xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 h-11 px-6 font-bold"
                    >
                        <Plus className="mr-2 h-4.5 w-4.5" /> 현장 일당 기록
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <Tabs defaultValue="overview" className="space-y-8">
                <div className="sticky top-20 z-40 py-3 -mx-4 px-4 backdrop-blur-xl bg-background/40 rounded-3xl border border-white/5 shadow-2xl">
                    <TabsList className="bg-white/5 h-12 p-1.5 rounded-2xl flex w-full md:w-fit gap-1">
                        <TabsTrigger value="overview" className="flex-1 md:flex-none rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[11px] uppercase tracking-widest transition-all gap-2 border border-transparent data-[state=active]:border-white/10">
                            <LayoutGrid className="h-4 w-4" /> Overview
                        </TabsTrigger>
                        <TabsTrigger value="pipeline" className="flex-1 md:flex-none rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[11px] uppercase tracking-widest transition-all gap-2 border border-transparent data-[state=active]:border-white/10">
                            <FolderOpen className="h-4 w-4" /> Pipeline
                        </TabsTrigger>
                        <TabsTrigger value="cashflow" className="flex-1 md:flex-none rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[11px] uppercase tracking-widest transition-all gap-2 border border-transparent data-[state=active]:border-white/10">
                            <Wallet2 className="h-4 w-4" /> Cashflow
                        </TabsTrigger>
                        <TabsTrigger value="ledger" className="flex-1 md:flex-none rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[11px] uppercase tracking-widest transition-all gap-2 border border-transparent data-[state=active]:border-white/10">
                            <LayoutGrid className="h-4 w-4" /> Ledger
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="flex-1 md:flex-none rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[11px] uppercase tracking-widest transition-all gap-2 border border-transparent data-[state=active]:border-white/10">
                            <Settings className="h-4 w-4" /> Settings
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="border-none p-0 outline-none animate-in fade-in slide-in-from-bottom-4">
                    <BusinessDashboard key={dashboardKey} />
                </TabsContent>

                <TabsContent value="pipeline" className="border-none p-0 outline-none animate-in fade-in slide-in-from-bottom-4">
                    <IncomeKanban />
                </TabsContent>

                <TabsContent value="cashflow" className="border-none p-0 outline-none animate-in fade-in slide-in-from-bottom-4">
                    <CashflowCalendar />
                </TabsContent>

                <TabsContent value="ledger" className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <Card className="rounded-3xl border-white/10 bg-slate-900/40 backdrop-blur-xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-white/5 px-8 pt-8">
                            <div>
                                <CardTitle className="text-lg font-black text-white uppercase tracking-tight">Financial Ledger</CardTitle>
                                <CardDescription className="text-slate-500 font-bold italic mt-1 uppercase text-[10px] tracking-widest">Permanent Transaction Logs</CardDescription>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => setIsLogModalOpen(true)}
                                className="bg-primary hover:bg-primary/80 rounded-xl font-black uppercase text-[10px] tracking-widest h-9 px-4"
                            >
                                <Plus className="mr-1.5 h-3.5 w-3.5" /> Log Entry
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-4">
                                <DailyRateTable refreshKey={tableRefreshKey} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <section className="glass-panel p-8 rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl">
                        <h2 className="text-xl font-black text-white uppercase tracking-tight mb-6">Business profile</h2>
                        <BusinessProfileSettings />
                    </section>
                </TabsContent>
            </Tabs>

            {/* Modals */}
            <LogDailyRateModal
                open={isLogModalOpen}
                onClose={() => setIsLogModalOpen(false)}
                onSuccess={handleLogSuccess}
            />
        </div>
    )
}
