"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { getDailyRateLogs } from '@/entities/daily-rate/api/get-daily-logs'
import { getProjects } from '@/entities/project/api/get-projects'
import { Wallet, TrendingUp, Users, Briefcase } from 'lucide-react'

export function BusinessDashboard() {
    const [stats, setStats] = useState({
        activeProjects: 0,
        monthlyRevenue: 0,
        pendingPayments: 0,
        crewCost: 0
    })

    useEffect(() => {
        async function loadStats() {
            const projects = await getProjects('active')
            const logs = await getDailyRateLogs() // 이번달 데이터 필터링 로직 추가 필요

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
        }
        loadStats()
    }, [])

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">진행 중 프로젝트</CardTitle>
                    <Briefcase className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.activeProjects}개</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">이달의 매출 (세전)</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₩{stats.monthlyRevenue.toLocaleString()}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">미결제 일당 건수</CardTitle>
                    <Wallet className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.pendingPayments}건</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">크루 인건비 지출</CardTitle>
                    <Users className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₩{stats.crewCost.toLocaleString()}</div>
                </CardContent>
            </Card>
        </div>
    )
}
