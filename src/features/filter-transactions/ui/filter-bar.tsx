'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Calendar, Clock, Sparkles } from 'lucide-react'

export function FilterBar() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const currentYear = Number(searchParams.get('year')) || new Date().getFullYear()
    const currentMonth = Number(searchParams.get('month')) || new Date().getMonth() + 1
    const currentDateFilter = searchParams.get('dateFilter')

    const updateFilter = (newParams: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams)
        Object.entries(newParams).forEach(([key, value]) => {
            if (value === null) params.delete(key)
            else params.set(key, value)
        })
        router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false })
    }

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateFilter({ year: e.target.value })
    }

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateFilter({ month: e.target.value === 'all' ? null : e.target.value })
    }

    const setDateFilter = (filter: string | null) => {
        if (currentDateFilter === filter) {
            updateFilter({ dateFilter: null })
        } else {
            updateFilter({ dateFilter: filter })
        }
    }

    return (
        <div className="flex flex-col sm:flex-row gap-4 p-4 mb-4 tactile-panel rounded-[1.5rem] items-start sm:items-center bg-background/50 backdrop-blur-md">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">연도</label>
                    <select
                        className="h-8 w-[90px] rounded-full [box-shadow:var(--tactile-inner)] bg-background/30 px-3 text-[13px] font-bold focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all border-none"
                        value={currentYear}
                        onChange={handleYearChange}
                    >
                        <option value="2024">2024년</option>
                        <option value="2025">2025년</option>
                        <option value="2026">2026년</option>
                        <option value="2027">2027년</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">월</label>
                    <select
                        className="h-8 w-[80px] rounded-full [box-shadow:var(--tactile-inner)] bg-background/30 px-3 text-[13px] font-bold focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all border-none"
                        value={searchParams.get('month') || 'all'}
                        onChange={handleMonthChange}
                    >
                        <option value="all">전체</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                            <option key={m} value={m.toString()}>{m}월</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="h-4 w-px bg-muted/20 hidden sm:block mx-2" />

            <div className="flex flex-wrap gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDateFilter('today')}
                    className={cn(
                        "h-8 rounded-full text-xs font-bold px-4 transition-all duration-300",
                        currentDateFilter === 'today' 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                        : "bg-background/40 hover:bg-background/60 text-muted-foreground [box-shadow:var(--tactile-shadow-sm)]"
                    )}
                >
                    <Clock className="w-3 h-3 mr-1.5" />
                    오늘
                </Button>
                
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDateFilter('this_week')}
                    className={cn(
                        "h-8 rounded-full text-xs font-bold px-4 transition-all duration-300",
                        currentDateFilter === 'this_week' 
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                        : "bg-background/40 hover:bg-background/60 text-muted-foreground [box-shadow:var(--tactile-shadow-sm)]"
                    )}
                >
                    <Calendar className="w-3 h-3 mr-1.5" />
                    이번 주
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDateFilter('scheduled')}
                    className={cn(
                        "h-8 rounded-full text-xs font-bold px-4 transition-all duration-300",
                        currentDateFilter === 'scheduled' 
                        ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" 
                        : "bg-background/40 hover:bg-background/60 text-muted-foreground [box-shadow:var(--tactile-shadow-sm)]"
                    )}
                >
                    <Sparkles className="w-3 h-3 mr-1.5" />
                    지출 예정
                </Button>
            </div>
        </div>
    )
}
