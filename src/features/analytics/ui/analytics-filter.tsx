'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/shared/ui/card'

export function AnalyticsFilter() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const currentYear = Number(searchParams.get('year')) || new Date().getFullYear()
    const currentMonth = Number(searchParams.get('month')) || new Date().getMonth() + 1

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const year = e.target.value
        const params = new URLSearchParams(searchParams)
        params.set('year', year)
        router.push(`/analytics?${params.toString()}`, { scroll: false })
    }

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const month = e.target.value
        const params = new URLSearchParams(searchParams)
        params.set('month', month)
        router.push(`/analytics?${params.toString()}`, { scroll: false })
    }

    return (
        <Card className="flex gap-4 p-4 glass-panel border-white/5 items-center">
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">연도</label>
                <select
                    className="h-9 w-[100px] rounded-md border border-white/10 bg-black/20 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={currentYear}
                    onChange={handleYearChange}
                >
                    <option value="2024">2024년</option>
                    <option value="2025">2025년</option>
                </select>
            </div>

            <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">월</label>
                <select
                    className="h-9 w-[100px] rounded-md border border-white/10 bg-black/20 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={currentMonth}
                    onChange={handleMonthChange}
                >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>{m}월</option>
                    ))}
                </select>
            </div>
        </Card>
    )
}
