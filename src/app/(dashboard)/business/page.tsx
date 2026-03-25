"use client"

import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card'

import { BusinessDashboard } from '@/widgets/business-dashboard/ui/BusinessDashboard'
import { CashflowCalendar } from '@/widgets/cashflow-calendar/ui/CashflowCalendar'
import { BusinessProfileSettings } from '@/features/manage-business-profile'
import { LogDailyRateModal } from '@/features/log-daily-rate/ui/LogDailyRateModal'
import { DailyRateTable } from '@/features/manage-daily-rate/ui/DailyRateTable'
import { Button } from '@/shared/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import Link from 'next/link'
import { Plus, LayoutGrid, Settings, Wallet2, FolderOpen, Users, Loader2 } from 'lucide-react'
import { ClientListWidget } from '@/widgets/client-list/ui/ClientListWidget'
import { getProjects } from '@/entities/project/api'
import { ProjectCard, ProjectDetailModal } from '@/entities/project'
import type { Project } from '@/entities/project/model/types'
import { getBusinessProfiles } from '@/features/manage-business-profile/api/business-profile-api'

export default function BusinessPage() {
    const router = useRouter()
    const [isLogModalOpen, setIsLogModalOpen] = useState(false)
    const [dashboardKey, setDashboardKey] = useState(0)
    const [tableRefreshKey, setTableRefreshKey] = useState(0)

    // Euiyoung Projects State
    const [euiyoungProjects, setEuiyoungProjects] = useState<Project[]>([])
    const [isProjectsLoading, setIsProjectsLoading] = useState(false)
    const [selectedProject, setSelectedProject] = useState<Project | null>(null)
    const [projectsRefreshKey, setProjectsRefreshKey] = useState(0)
    const [profiles, setProfiles] = useState<any[]>([])

    const fetchEuiyoungProjects = useCallback(async () => {
        setIsProjectsLoading(true)
        try {
            const data = await getProjects({ owner: 'euiyoung' })
            setEuiyoungProjects(data)
        } finally {
            setIsProjectsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchEuiyoungProjects()
    }, [fetchEuiyoungProjects, projectsRefreshKey])

    useEffect(() => {
        getBusinessProfiles().then(setProfiles).catch(console.error)
    }, [])

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
                        <span className="h-1 w-8 rounded-full bg-primary" />
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">Management Suite</span>
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
                        className="rounded-xl bg-primary hover:bg-blue-700 shadow-blue-500/20 h-11 px-6 font-bold"
                    >
                        <Plus className="mr-2 h-4.5 w-4.5" /> 현장 일당 기록
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <Tabs defaultValue="overview" className="space-y-8">
                <div className="sticky top-20 z-40 py-3 -mx-4 px-4 bg-background/40 rounded-[2rem]">
                    <TabsList className="bg-white/5 h-12 p-1.5 rounded-2xl flex w-full md:w-fit gap-1">
                        <TabsTrigger value="overview" className="flex-1 md:flex-none rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[11px] uppercase tracking-widest transition-all gap-2 border-transparent">
                            <LayoutGrid className="h-4 w-4" /> Overview
                        </TabsTrigger>
                        <TabsTrigger value="euiyoung" className="flex-1 md:flex-none rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[11px] uppercase tracking-widest transition-all gap-2 border-transparent">
                            <FolderOpen className="h-4 w-4" /> Euiyoung Projects
                        </TabsTrigger>
                        <TabsTrigger value="kwangjun" className="flex-1 md:flex-none rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[11px] uppercase tracking-widest transition-all gap-2 border-transparent">
                            <LayoutGrid className="h-4 w-4" /> Kwangjun Ledger
                        </TabsTrigger>
                        <TabsTrigger value="cashflow" className="flex-1 md:flex-none rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[11px] uppercase tracking-widest transition-all gap-2 border-transparent">
                            <Wallet2 className="h-4 w-4" /> Cashflow
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="flex-1 md:flex-none rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[11px] uppercase tracking-widest transition-all gap-2 border-transparent">
                            <Settings className="h-4 w-4" /> Settings
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="border-none p-0 outline-none animate-in fade-in slide-in-from-bottom-4">
                    <BusinessDashboard key={dashboardKey} />
                </TabsContent>

                <TabsContent value="euiyoung" className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black text-white uppercase tracking-tight px-2">Euiyoung's Project Center</h2>
                        <Button variant="outline" size="sm" asChild className="rounded-xl font-black text-[10px] uppercase tracking-widest">
                            <Link href="/business/projects">전체 프로젝트 보기</Link>
                        </Button>
                    </div>
                    
                    {isProjectsLoading ? (
                        <div className="flex h-[300px] items-center justify-center bg-white/5 rounded-[2rem] border border-dashed text-slate-500">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : euiyoungProjects.length === 0 ? (
                        <div className="flex h-[300px] flex-col items-center justify-center bg-white/5 rounded-[2rem] border border-dashed text-slate-500">
                            <FolderOpen className="h-10 w-10 mb-4 opacity-20" />
                            <p className="font-bold">진행 중인 프로젝트가 없습니다.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {euiyoungProjects.map(project => (
                                <ProjectCard 
                                    key={project.id} 
                                    project={project} 
                                    onSelect={() => setSelectedProject(project)}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="kwangjun" className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <Card className="rounded-[2rem] bg-background overflow-hidden border-none shadow-2xl">
                        <CardHeader className="flex flex-row items-center justify-between pb-6 border-b px-8 pt-8 bg-white/5">
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

                <TabsContent value="cashflow" className="border-none p-0 outline-none animate-in fade-in slide-in-from-bottom-4">
                    <CashflowCalendar />
                </TabsContent>

                <TabsContent value="settings" className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <section className="tactile-panel p-8 rounded-[2rem] bg-background border border-white/5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                <Settings className="h-4 w-4 text-primary" />
                            </div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Business profile</h2>
                        </div>
                        <BusinessProfileSettings />
                    </section>

                    <section className="tactile-panel p-8 rounded-[2rem] bg-background border border-white/5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <Users className="h-4 w-4 text-blue-400" />
                            </div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Client Relationship Management</h2>
                        </div>
                        <ClientListWidget />
                    </section>
                </TabsContent>
            </Tabs>

            {/* Modals */}
            <LogDailyRateModal
                open={isLogModalOpen}
                onClose={() => setIsLogModalOpen(false)}
                onSuccess={handleLogSuccess}
            />

            {selectedProject && (
                <ProjectDetailModal 
                    project={selectedProject}
                    profiles={profiles}
                    open={!!selectedProject}
                    onClose={() => setSelectedProject(null)}
                    onUpdated={() => setProjectsRefreshKey(k => k + 1)}
                    onDeleted={() => {
                        setSelectedProject(null)
                        setProjectsRefreshKey(k => k + 1)
                    }}
                />
            )}
        </div>
    )
}
