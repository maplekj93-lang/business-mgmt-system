"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import Link from 'next/link'
import { Calendar, ChevronRight, FileBarChart, ArrowLeft } from 'lucide-react'

export default function ReportsPage() {
    const years = [2026, 2025]
    const months = Array.from({ length: 12 }, (_, i) => i + 1).reverse()

    return (
        <div className="flex flex-col gap-10 p-4 md:p-8 max-w-7xl mx-auto pb-20">
            {/* Header Area */}
            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-border/40">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="h-1 w-8 rounded-full bg-indigo-500" />
                        <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Business Intelligence</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        비즈니스 리포트
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium">월별 성과 요약 및 상세 수익성 분석 레포트</p>
                </div>

                <Button variant="outline" asChild className="rounded-xl border-border/60 h-11 px-5">
                    <Link href="/business">
                        <ArrowLeft className="mr-2 h-4 w-4" /> 대시보드로 돌아가기
                    </Link>
                </Button>
            </div>

            {/* Reports Grid */}
            <div className="space-y-12">
                {years.map(year => (
                    <div key={year} className="space-y-6">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black text-white italic">{year}년</h2>
                            <div className="h-px flex-1 bg-white/5" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {months.map(month => {
                                // 미래의 달은 비활성화 처리 (데모를 위해 현재 3월까지만 활성화)
                                const isFuture = year === 2026 && month > 3
                                
                                return (
                                    <Link 
                                        key={month} 
                                        href={isFuture ? "#" : `/reports/${year}/${month}`}
                                        className={isFuture ? "pointer-events-none opacity-40" : ""}
                                    >
                                        <Card className="group relative overflow-hidden rounded-[2rem] bg-background border-none shadow-xl transition-all hover:bg-slate-900/60 hover:ring-1 hover:ring-indigo-500/30">
                                            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-indigo-500/5 blur-2xl group-hover:bg-indigo-500/10 transition-all" />
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-xl font-black text-white">{month}월</CardTitle>
                                                <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-500 shadow-sm ring-1 ring-indigo-500/20">
                                                    <Calendar className="h-4 w-4" />
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-xs text-slate-500 font-bold mb-4">Monthly Performance Summary</p>
                                                <div className="flex items-center justify-between text-indigo-400 group-hover:translate-x-1 transition-transform">
                                                    <span className="text-[10px] font-black uppercase tracking-widest">View Report</span>
                                                    <ChevronRight className="h-4 w-4" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
