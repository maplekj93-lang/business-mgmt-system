import React from 'react';
import Link from 'next/link';
import { createClient } from '@/shared/api/supabase/server';
import { cn } from '@/shared/lib/utils';
import {
  Wallet,
  Briefcase,
  TrendingUp,
  CreditCard,
  Clock,
  Receipt,
  ChevronRight,
  Plus
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';

import { getOverhaulDashboardData } from '@/widgets/dashboard/api/get-overhaul-dashboard-data';

export default async function Home() {
  const data = await getOverhaulDashboardData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Welcome Section */}
      <section className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">좋은 하루입니다, 광준님!</h1>
          <p className="text-muted-foreground mt-1">오늘의 재정 상태를 한눈에 확인해보세요.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-full [box-shadow:var(--tactile-inner)]">
          <Clock className="w-4 h-4" />
          <span>마지막 업데이트: 방금 전</span>
        </div>
      </section>

      {/* 50:50 Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[600px]">

        {/* Left Side: Family / Personal Finance */}
        <section className="space-y-6 flex flex-col pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                <Wallet className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold">가계부 (Family)</h2>
            </div>
            <Link href="/transactions/unclassified">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                전체 내역 <ChevronRight className="ml-1 w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Personal Summary Card */}
          <Card className="bg-gradient-to-br from-blue-600/20 to-indigo-600/5 border-none overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-24 h-24" />
            </div>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-blue-400/80">당월 총 지출</CardTitle>
              <p className="text-3xl font-bold tabular-nums italic">{formatCurrency(data.personal.monthlyExpense)}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">남은 예산 ({formatCurrency(data.personal.budget)} 중)</span>
                  <span className="font-medium">{formatCurrency(data.personal.budget - data.personal.monthlyExpense)} ({Math.round((1 - data.personal.monthlyExpense / data.personal.budget) * 100)}%)</span>
                </div>
                <Progress value={(data.personal.monthlyExpense / data.personal.budget) * 100} className="h-2 bg-muted" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 rounded-2xl bg-muted/30 [box-shadow:var(--tactile-inner)]">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">카드 사용액</p>
                  <p className="text-base font-semibold text-foreground">{formatCurrency(data.personal.cardSpending)}</p>
                </div>
                <div className="p-3 rounded-2xl bg-muted/30 [box-shadow:var(--tactile-inner)]">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">다음 결제액</p>
                  <p className="text-base font-semibold text-foreground">{formatCurrency(data.personal.nextPayment)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats or Small Widgets */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/transactions/unclassified" className="tactile-card p-5 cursor-pointer block">
              <Receipt className="w-5 h-5 text-indigo-400 mb-3" />
              <p className="text-xs text-muted-foreground">미분류 지출</p>
              <p className="text-lg font-bold text-foreground">{data.personal.unclassifiedCount} 건</p>
            </Link>
            <div className="tactile-card p-5 cursor-pointer flex flex-col items-start">
              <CreditCard className="w-5 h-5 text-indigo-400 mb-3" />
              <p className="text-xs text-muted-foreground">주요 사용 카드</p>
              <p className="text-lg font-bold text-foreground">현대카드 ZERO</p>
            </div>
          </div>
        </section>

        {/* Right Side: Business Management */}
        <section className="space-y-6 flex flex-col pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold">사업 (Business)</h2>
            </div>
            <Link href="/business/projects">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                프로젝트 현황 <ChevronRight className="ml-1 w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Business Summary Card */}
          <Card className="bg-gradient-to-br from-emerald-600/20 to-teal-600/5 border-none overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Briefcase className="w-24 h-24" />
            </div>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-emerald-400/80">예상 미수금 (Outstanding)</CardTitle>
              <p className="text-3xl font-bold tabular-nums italic text-emerald-400">{formatCurrency(data.business.outstandingAmount)}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">당월 매출 ({formatCurrency(data.business.targetRevenue)} 목표)</span>
                  <span className="font-medium">{formatCurrency(data.business.currentRevenue)} ({Math.round((data.business.currentRevenue / data.business.targetRevenue) * 100)}%)</span>
                </div>
                <Progress value={(data.business.currentRevenue / data.business.targetRevenue) * 100} className="h-2 bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 rounded-2xl bg-muted/30 [box-shadow:var(--tactile-inner)]">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">진행 중 프로젝트</p>
                  <p className="text-base font-semibold text-foreground">{data.business.activeProjectCount} 건</p>
                </div>
                <div className="p-3 rounded-2xl bg-muted/30 [box-shadow:var(--tactile-inner)]">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">미발행 세금계산서</p>
                  <p className="text-base font-semibold text-foreground">{formatCurrency(data.business.unbilledAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Projects List */}
          {/* Business Projects List */}
          <div className="tactile-panel flex-1 p-6 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-foreground/80">중요 프로젝트</h3>
              <Link href="/business/projects">
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                  <Plus className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
              {data.business.recentProjects.length > 0 ? (
                data.business.recentProjects.map((project, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:[box-shadow:var(--tactile-inner)] transition-all group cursor-pointer bg-transparent">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full animate-pulse",
                        project.status === '진행중' ? 'bg-blue-500' : project.status === '완료' ? 'bg-emerald-500' : 'bg-amber-500'
                      )} />
                      <div className="max-w-[150px] md:max-w-[200px] truncate">
                        <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{project.name}</p>
                        <p className="text-[10px] text-muted-foreground">{project.date} 마감</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-foreground">{formatCurrency(project.amount)}</p>
                      <p className="text-[10px] text-muted-foreground">{project.status}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-zinc-600">
                  <Briefcase className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs">등록된 프로젝트가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
