"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/shared/ui/card'
import { Progress } from "@/shared/ui/progress"
import { Button } from '@/shared/ui/button'
import { ExternalLink, CalendarDays, Loader2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { getMonthlyRecurringSummary } from '@/entities/recurring-expense/api/recurring-expense-api'
import type { RecurringExpenseSummary } from '@/entities/recurring-expense/model/types'

export function RecurringExpenseCard() {
  const [summary, setSummary] = useState<RecurringExpenseSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSummary() {
      try {
        const today = new Date()
        const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
        const data = await getMonthlyRecurringSummary(yearMonth)
        setSummary(data)
      } catch (error) {
        console.error('Failed to load recurring summary:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSummary()
  }, [])

  if (loading) {
    return (
      <Card className="h-full bg-background">
        <CardContent className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        </CardContent>
      </Card>
    )
  }

  // 데이터가 없을 때
  if (!summary || summary.total_count === 0) {
    return (
      <Card className="h-full bg-background flex flex-col hover:bg-slate-900/60 transition-all">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-200">
              <CalendarDays className="h-4 w-4 text-primary" />
              요약: 이번 달 고정비
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-center items-center text-center py-6">
          <p className="text-sm text-slate-500 mb-4">등록된 고정비나 지출 예정 구독이 없습니다.</p>
          <Button variant="outline" size="sm" asChild className="text-slate-300">
            <Link href="/settings/recurring-expenses">
              고정비 등록하기
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const progressValue = summary.total_count > 0 
    ? (summary.recorded_count / summary.total_count) * 100 
    : 0

  return (
    <Card className="h-full bg-background flex flex-col hover:bg-slate-900/60 hover: hover:shadow-primary/10 transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-200">
            <CalendarDays className="h-4 w-4 text-primary" />
            이번 달 고정비 요약
          </CardTitle>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/50">
            {summary.status === 'complete' ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            )}
            <span className="text-[10px] font-medium text-slate-300 uppercase">
              {summary.status === 'pending' ? '결제 예정' : summary.status === 'partial' ? '진행 중' : '결제 완료'}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-2">
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-xl font-bold text-slate-400">₩</span>
          <h3 className="text-3xl font-black tracking-tight text-white">{summary.total_amount.toLocaleString()}</h3>
        </div>
        
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-400">이번 달 결제 진행률</span>
            <span className="text-slate-200">{summary.recorded_count} / {summary.total_count}건</span>
          </div>
          <Progress value={progressValue} className="h-2 bg-slate-800" />
        </div>
      </CardContent>
      
      <CardFooter className="pt-4 border-t">
        <Button variant="ghost" size="sm" asChild className="w-full text-xs text-slate-400 hover:text-white justify-between">
          <Link href="/settings/recurring-expenses">
            상세 관리 및 내역 보기
            <ExternalLink className="h-3 w-3 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
