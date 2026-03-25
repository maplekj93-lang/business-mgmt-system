import React from 'react';
import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import {
  Wallet,
  Briefcase,
  TrendingUp,
  CreditCard,
  Clock,
  Receipt,
  ChevronRight,
  Plus,
  PlusCircle,
  Download,
  Users,
  Settings,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';
import { getOverhaulDashboardData } from '@/widgets/dashboard/api/get-overhaul-dashboard-data';
import { ReceivablesAlertCard } from '@/widgets/receivables-alert/ui/ReceivablesAlertCard';
import { CashflowDashboardWidget } from '@/widgets/cashflow-dashboard/ui/CashflowDashboardWidget';

export default async function Home() {
  const data = await getOverhaulDashboardData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">좋은 하루입니다, 광준님!</h1>
          <p className="text-muted-foreground mt-1 text-lg">오늘의 재정 상태를 한눈에 확인해보세요.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-full border border-border/50 backdrop-blur-sm">
          <Clock className="w-4 h-4" />
          <span>마지막 업데이트: 방금 전</span>
        </div>
      </section>

      {/* Cashflow Insights Widget */}
      <CashflowDashboardWidget />

      {/* Row 1: Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-none shadow-md overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Wallet className="w-20 h-20" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">현재 총 자산</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{formatCurrency(data.summary.totalBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-emerald-500 font-bold">▲ 2.5%</span> 지난 달 대비
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-none shadow-md overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <CreditCard className="w-20 h-20" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">당월 지출 총액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{formatCurrency(data.summary.monthlySpent)}</div>
            <div className="mt-2 text-xs flex justify-between mb-1">
                <span>예산 대비</span>
                <span className="font-bold">{Math.round((data.summary.monthlySpent / data.personal.budget) * 100)}%</span>
            </div>
            <Progress value={(data.summary.monthlySpent / data.personal.budget) * 100} className="h-1.5" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-none shadow-md overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <TrendingUp className="w-20 h-20" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">일일 평균 지출</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{formatCurrency(data.summary.dailyAverage)}</div>
            <p className="text-xs text-muted-foreground mt-1">
                지지난달 평균: {formatCurrency(Math.round(data.summary.dailyAverage * 0.95))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Layer: Recent Transactions (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              최근 거래 내역
            </h2>
            <Link href="/ledger">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                전체 보기 <ChevronRight className="ml-1 w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="tactile-panel overflow-hidden border border-border/40 bg-card">
            <div className="divide-y divide-border/40">
              {data.recentTransactions.length > 0 ? (
                data.recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center border",
                        tx.type === 'income' 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                          : "bg-red-500/10 border-red-500/20 text-red-500"
                      )}>
                        {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{tx.description}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mt-0.5">
                          {tx.date} • {tx.category}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-black text-sm",
                        tx.type === 'income' ? "text-emerald-500" : "text-foreground"
                      )}>
                        {tx.type === 'income' ? '+' : ''}{formatCurrency(tx.amount)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                  <Receipt className="w-12 h-12 mb-2" />
                  <p>최근 거래 내역이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Layer: Widgets & Quick Actions (1/3 width on desktop) */}
        <div className="space-y-8">
          
          {/* Quick Actions */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold">빠른 작업</h2>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 rounded-2xl border-2 hover:border-primary/50 hover:bg-primary/5 group" asChild>
                <Link href="/ledger?action=new">
                  <PlusCircle className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-foreground">지출 기록</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 rounded-2xl border-2 hover:border-blue-500/50 hover:bg-blue-500/5 group" asChild>
                <Link href="/import">
                  <Download className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-foreground">내역 로드</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 rounded-2xl border-2 hover:border-emerald-500/50 hover:bg-emerald-500/5 group">
                <Users className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-foreground">더치페이</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 rounded-2xl border-2 hover:border-muted-foreground/50 hover:bg-muted group">
                <Settings className="w-6 h-6 text-muted-foreground group-hover:rotate-45 transition-transform" />
                <span className="text-xs font-bold text-foreground">설정</span>
              </Button>
            </div>
          </section>

          {/* Business projects summary (Reused from previous design but fits better here) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">중요 프로젝트</h2>
              <Link href="/business">
                <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground">전체보기</Button>
              </Link>
            </div>
            
            <ReceivablesAlertCard />

            <div className="tactile-panel p-5 space-y-4 bg-emerald-500/[0.03] border-emerald-500/10">
              {data.business.recentProjects.length > 0 ? (
                data.business.recentProjects.map((project, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-border/30 pb-3 last:border-0 last:pb-0">
                    <div className="flex flex-col">
                      <p className="text-xs font-bold text-foreground truncate max-w-[120px]">{project.name}</p>
                      <p className="text-[10px] text-muted-foreground">{project.status}</p>
                    </div>
                    <p className="text-xs font-black text-foreground">{formatCurrency(project.amount)}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-center text-muted-foreground py-4">활성 프로젝트가 없습니다.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
