"use client"

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { PIPELINE_STATUSES, type PipelineStatus } from '@/shared/constants/business'
import { cn } from '@/shared/lib/utils'
import { KanbanCard } from './KanbanCard'
import type { ProjectIncome } from '@/entities/project/model/types'

interface KanbanColumnProps {
    status: PipelineStatus
    incomes: ProjectIncome[]
}

export function KanbanColumn({ status, incomes }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: status,
    })

    const columnTotal = incomes.reduce((sum, item) => sum + item.amount, 0)

    // Status-specific colors
    const getStatusColor = (status: string) => {
        switch (status) {
            case '작업중': return 'text-primary'
            case '작업완료': return 'text-emerald-400'
            case '입금대기': return 'text-amber-500'
            case '입금완료': return 'text-sky-400'
            case '의뢰중': return 'text-slate-400'
            case '보류취소': return 'text-rose-500'
            default: return 'text-slate-400'
        }
    }

    const statusColor = getStatusColor(status)

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex flex-col w-80 min-w-[20rem] bg-background  rounded-2xl p-4   h-full transition-all relative overflow-hidden",
                isOver && "bg-primary/5 border-primary/30 ring-1 ring-primary/20",
                status === '작업중' && "ring-1 ring-primary/20 bg-primary/5"
            )}
        >
            <div className="flex items-center justify-between mb-5 px-1 relative z-10">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <h3 className={cn("font-black text-[11px] tracking-widest uppercase italic", statusColor)}>
                            {status}
                        </h3>
                        <span className="text-[10px] font-black text-white bg-white/5 px-2 py-0.5 rounded-full">
                            {incomes.length}
                        </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500">
                        ₩{columnTotal.toLocaleString()}
                    </p>
                </div>
                <button className="h-6 w-6 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <Plus className="h-3 w-3 text-slate-400" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-[100px] space-y-4 px-0.5 scrollbar-hide relative z-10">
                {incomes.map((income) => (
                    <KanbanCard key={income.id} income={income} />
                ))}
                {incomes.length === 0 && !isOver && (
                    <div className="h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-[11px] text-slate-600 bg-white/[0.02] gap-2 transition-all hover:bg-white/[0.04]">
                        <div className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center">
                            <Plus className="h-4 w-4 opacity-40" />
                        </div>
                        <span className="font-bold uppercase tracking-widest opacity-40">비어 있음</span>
                    </div>
                )}
            </div>

            {/* Subtle glow for active column */}
            {status === '작업중' && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
            )}
        </div>
    )
}
