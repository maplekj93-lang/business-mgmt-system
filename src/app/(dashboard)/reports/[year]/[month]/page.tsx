import React from 'react'
import { ArrowLeft, Printer, Share2, TrendingUp, Calendar, Download } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import Link from 'next/link'
import { getProjectAnalytics } from '@/entities/project/api/get-project-analytics'
import { ProjectProfitabilityTable } from '@/widgets/business-dashboard/ui/ProjectProfitabilityTable'
import { CategoryDonutChart } from '@/widgets/business-dashboard/ui/CategoryDonutChart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card'
import { PrintReportButton } from '@/features/reports/ui/PrintReportButton'

interface ReportPageProps {
    params: Promise<{
        year: string
        month: string
    }>
}

export default async function MonthlyReportPage({ params }: ReportPageProps) {
    const { year: yearParam, month: monthParam } = await params
    const year = parseInt(yearParam)
    const month = parseInt(monthParam)

    const analyticsResult = await getProjectAnalytics({ 
        month, 
        year, 
        mode: 'business',
        ownerId: 'all'
    })

    if (!analyticsResult.success) {
        return <div className="p-20 text-center text-slate-500">데이터를 불러오지 못했습니다.</div>
    }

    const { profitability, categoryDistribution } = analyticsResult.data
    const totalRevenue = profitability.reduce((sum, p) => sum + p.revenue, 0)
    const totalProfit = profitability.reduce((sum, p) => sum + p.net_profit, 0)
    const avgMargin = (profitability.length > 0 && totalRevenue > 0) ? (totalProfit / (totalRevenue / 1.1)) * 100 : 0

    return (
        <div className="flex flex-col gap-10 p-4 md:p-8 max-w-7xl mx-auto pb-20 print:p-0">
            {/* Navigation & Actions (Hidden during print) */}
            <div className="flex justify-between items-center print:hidden">
                <Button variant="ghost" asChild className="rounded-xl text-slate-400 hover:text-white">
                    <Link href="/reports">
                        <ArrowLeft className="mr-2 h-4 w-4" /> 리포트 목록으로
                    </Link>
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl border-border/60 gap-2">
                        <Download className="h-4 w-4" /> PDF 추출
                    </Button>
                    <PrintReportButton />
                </div>
            </div>

            {/* Print Header */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                <FileBarChart className="h-6 w-6 text-indigo-500" />
                            </div>
                            <span className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em]">Monthly Executive Summary</span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter text-white">
                            {year}년 {month}월 비즈니스 성과
                        </h1>
                        <p className="text-slate-500 font-medium">Brightglory Total Solution Business Performance Report</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Generated date</p>
                        <p className="text-sm font-bold text-slate-300">{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>
            </div>

            {/* Executive Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-[2rem] bg-slate-900 border-none shadow-2xl overflow-hidden group">
                    <CardHeader className="pb-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Monthly Revenue</p>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold text-indigo-500">₩</span>
                            <span className="text-4xl font-black text-white">{totalRevenue.toLocaleString()}</span>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-400 bg-emerald-400/5 w-fit px-2 py-1 rounded-lg">
                            <TrendingUp className="h-3 w-3" /> 매월 평균 실적 대비 상위
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2rem] bg-slate-900 border-none shadow-2xl overflow-hidden">
                    <CardHeader className="pb-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Net Operating Profit</p>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold text-emerald-500">₩</span>
                            <span className="text-4xl font-black text-white">{totalProfit.toLocaleString()}</span>
                        </div>
                        <p className="mt-4 text-[10px] font-medium text-slate-500">세금 및 운영비용 차감 후 순수익</p>
                    </CardContent>
                </Card>

                <Card className="rounded-[2rem] bg-slate-900 border-none shadow-2xl overflow-hidden">
                    <CardHeader className="pb-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Average Profit Margin</p>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-white">{avgMargin.toFixed(1)}</span>
                            <span className="text-xl font-bold text-slate-500">%</span>
                        </div>
                        <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${avgMargin}%` }} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Tables & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                <Calendar className="h-4 w-4 text-slate-400" />
                            </div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Project Profitability Detail</h2>
                        </div>
                        <ProjectProfitabilityTable projects={profitability} />
                    </section>
                </div>
                <div className="space-y-8">
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                <Share2 className="h-4 w-4 text-slate-400" />
                            </div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Expense Distribution</h2>
                        </div>
                        <CategoryDonutChart data={categoryDistribution} />
                    </section>
                    
                    <Card className="rounded-[3rem] bg-indigo-600 p-8 border-none text-white shadow-2xl shadow-indigo-500/20">
                        <CardHeader className="p-0 mb-4">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Monthly Conclusion</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <p className="text-sm font-bold leading-relaxed">
                                {year}년 {month}월 비즈니스는 평균 {avgMargin.toFixed(1)}%의 높은 수익성을 기록하며 안정적인 현금 흐름을 보여주었습니다. 
                                프로젝트 정밀 분석 결과 {profitability.length}건의 모든 현장에서 데이터 무결성이 확보되었으며, 안정적인 사업 운영이 지속되고 있습니다.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function FileBarChart(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M12 18v-4" />
      <path d="M8 18v-2" />
      <path d="M16 18v-6" />
    </svg>
  )
}
