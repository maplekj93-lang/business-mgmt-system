"use client"

import React, { useEffect, useState } from 'react'
import { KanbanBoard } from '@/features/manage-pipeline'
import { getPipelineIncomes } from '@/entities/project/api/get-pipeline'
import type { ProjectIncome } from '@/entities/project/model/types'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { OWNER_LABELS, type OwnerType } from '@/shared/constants/business'
import { Loader2, Filter } from 'lucide-react'

export function IncomeKanban() {
    const [incomes, setIncomes] = useState<ProjectIncome[]>([])
    const [loading, setLoading] = useState(true)
    const [ownerFilter, setOwnerFilter] = useState<OwnerType | 'all'>('all')

    const fetchIncomes = async () => {
        setLoading(true)
        try {
            const data = await getPipelineIncomes(ownerFilter)
            setIncomes(data)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchIncomes()
    }, [ownerFilter])

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">사업 주체 필터</span>
                </div>

                <Tabs value={ownerFilter} onValueChange={(v: string) => setOwnerFilter(v as any)} className="w-full sm:w-auto">
                    <TabsList className="grid grid-cols-4 w-full sm:w-[400px]">
                        <TabsTrigger value="all">전체</TabsTrigger>
                        <TabsTrigger value="kwangjun">{OWNER_LABELS.kwangjun}</TabsTrigger>
                        <TabsTrigger value="euiyoung">{OWNER_LABELS.euiyoung}</TabsTrigger>
                        <TabsTrigger value="joint">{OWNER_LABELS.joint}</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-[500px] bg-slate-50/50 rounded-xl border border-dashed">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                    <p className="text-sm text-muted-foreground">파이프라인 데이터를 불러오는 중...</p>
                </div>
            ) : (
                <KanbanBoard initialIncomes={incomes} />
            )}
        </div>
    )
}
