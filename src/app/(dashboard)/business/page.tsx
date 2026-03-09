"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card'
import { BusinessDashboard } from '@/widgets/business-dashboard/ui/BusinessDashboard'
import { IncomeKanban } from '@/widgets/income-kanban/ui/IncomeKanban'
import { BusinessProfileSettings } from '@/features/manage-business-profile'
import { LogDailyRateModal } from '@/features/log-daily-rate/ui/LogDailyRateModal'
import { Button } from '@/shared/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Plus, BarChart3, LayoutGrid, Settings, Wallet2 } from 'lucide-react'

export default function BusinessPage() {
    const [isLogModalOpen, setIsLogModalOpen] = useState(false)

    return (
        <div className="flex flex-col gap-8 p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Business Management</h1>
                    <p className="text-muted-foreground">사업체 통합 관리 및 수입 파이프라인 대시보드</p>
                </div>
                <Button
                    onClick={() => setIsLogModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                >
                    <Plus className="mr-2 h-4 w-4" /> 일당 기록하기
                </Button>
            </div>

            {/* Summary Cards */}
            <BusinessDashboard />

            {/* Main Content Tabs */}
            <Tabs defaultValue="pipeline" className="space-y-6">
                <TabsList className="bg-slate-100/50 p-1">
                    <TabsTrigger value="pipeline" className="gap-2">
                        <LayoutGrid className="h-4 w-4" /> 수입 파이프라인
                    </TabsTrigger>
                    <TabsTrigger value="daily-rate" className="gap-2">
                        <Wallet2 className="h-4 w-4" /> 일당 기록 관리
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2">
                        <Settings className="h-4 w-4" /> 비즈니스 설정
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pipeline" className="border-none p-0 outline-none">
                    <IncomeKanban />
                </TabsContent>

                <TabsContent value="daily-rate" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>일당 기록 내역</CardTitle>
                            <CardDescription>광준 전용 퍼스트 일당 및 크루/진행비 정산 내역입니다.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground text-center py-20 border-2 border-dashed rounded-xl">
                                준비 중인 화면입니다. (데이터는 정상 저장됩니다)
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                    <section>
                        <h2 className="text-xl font-bold mb-4">자사 프로필 관리</h2>
                        <BusinessProfileSettings />
                    </section>
                </TabsContent>
            </Tabs>

            {/* Modals */}
            <LogDailyRateModal
                open={isLogModalOpen}
                onClose={() => setIsLogModalOpen(false)}
                onSuccess={() => {
                    // TODO: Refresh dashboard
                    window.location.reload();
                }}
            />
        </div>
    )
}
