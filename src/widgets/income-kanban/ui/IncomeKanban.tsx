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
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 glass-panel p-6 rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl">
                <div className="flex items-center gap-4 px-2">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
                        <Filter className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Filter Archive</span>
                        <p className="text-lg font-black text-white tracking-tight">Income Pipeline</p>
                    </div>
                </div>

                <Tabs value={ownerFilter} onValueChange={(v: string) => setOwnerFilter(v as any)} className="w-full sm:w-auto">
                    <TabsList className="bg-white/5 h-11 p-1 rounded-xl border border-white/10">
                        <TabsTrigger value="all" className="rounded-lg px-6 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest transition-all">전체</TabsTrigger>
                        <TabsTrigger value="kwangjun" className="rounded-lg px-6 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest transition-all">{OWNER_LABELS.kwangjun}</TabsTrigger>
                        <TabsTrigger value="euiyoung" className="rounded-lg px-6 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest transition-all">{OWNER_LABELS.euiyoung}</TabsTrigger>
                        <TabsTrigger value="joint" className="rounded-lg px-6 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest transition-all">{OWNER_LABELS.joint}</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-[600px] glass-panel rounded-3xl border border-dashed border-white/10 bg-slate-900/20">
                    <div className="relative">
                        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                    </div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-6 animate-pulse">Syncing Pipeline</p>
                </div>
            ) : (
                <KanbanBoard initialIncomes={incomes} />
            )}
        </div>
    )
}
