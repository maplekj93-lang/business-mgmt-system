"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/shared/ui/card'
import { Calendar } from "@/shared/ui/calendar"
import { getDueThisMonth } from '@/entities/recurring-expense/api/recurring-expense-api'
import type { RecurringExpense } from '@/entities/recurring-expense/model/types'
import { Loader2, CalendarHeart, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { ScrollArea } from '@/shared/ui/scroll-area'

export function RecurringExpenseCalendar() {
  const [expenses, setExpenses] = useState<RecurringExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState<Date | undefined>(new Date())

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getDueThisMonth() // 이번 달 리스트(자동/유동 모두 포함될 수 있음, API 단에서 is_auto_record=true만 가져오는 것을 롤백했는지 확인 필요)
        setExpenses(data)
      } catch (error) {
        console.error('Failed to load expenses for calendar:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <Card className="h-full bg-background">
        <CardContent className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        </CardContent>
      </Card>
    )
  }

  // 달력에 표시될 점묘(Modifiers) 생성 로직
  // 달력 날짜별로 등록된 expense가 있는지 확인
  const expenseDays = expenses.map(exp => new Date(exp.next_due_date))

  // 선택된 날짜에 해당하는 항목들 필터링
  const selectedDateExpenses = expenses.filter(exp => {
    if (!date) return false
    const expDate = new Date(exp.next_due_date)
    return expDate.getDate() === date.getDate() && 
           expDate.getMonth() === date.getMonth() && 
           expDate.getFullYear() === date.getFullYear()
  })

  return (
    <Card className="h-full bg-background flex flex-col hover:bg-slate-900/60 hover: hover:shadow-indigo-500/10 transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-200">
            <CalendarHeart className="h-4 w-4 text-indigo-400" />
            월간 결제 캘린더
          </CardTitle>
          <Badge variant="secondary" className="bg-slate-800 text-slate-300 hover:bg-slate-800">
            {expenses.length}건 예정
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col lg:flex-row gap-6 pt-4">
        <div className="flex-shrink-0 bg-slate-900/50 rounded-xl p-2">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            modifiers={{ 
                hasExpense: expenseDays,
            }}
            modifiersStyles={{
                hasExpense: { 
                    fontWeight: "bold", 
                    backgroundColor: "rgba(99, 102, 241, 0.2)", 
                    color: "rgb(129, 140, 248)",
                    border: "1px solid rgba(99, 102, 241, 0.4)"
                }
            }}
            className="text-slate-300"
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <h4 className="text-sm font-medium mb-3 text-slate-400 border-b pb-2">
            {date ? `${date.getMonth() + 1}월 ${date.getDate()}일 결제 예정` : "날짜를 선택하세요"}
          </h4>
          
          <ScrollArea className="flex-1 pr-4">
            {selectedDateExpenses.length > 0 ? (
              <div className="space-y-3">
                {selectedDateExpenses.map(exp => (
                  <div key={exp.id} className="p-3 rounded-lg bg-slate-800/50 flex flex-col gap-1.5">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-slate-200 truncate pr-2">{exp.name}</span>
                      <span className="font-bold whitespace-nowrap text-white">
                        {exp.amount.toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      {exp.is_auto_record === false ? (
                        <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30 bg-amber-500/10 h-5 px-1.5">
                          이번달 수동 결제 필요
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30 bg-emerald-500/10 h-5 px-1.5">
                          자동 기록
                        </Badge>
                      )}
                      
                      {exp.last_recorded_date && new Date(exp.last_recorded_date).getMonth() === date?.getMonth() && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          이미 결제됨
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-500 italic pb-8">
                예정된 결제가 없습니다
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
