"use client"

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
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

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex flex-col w-72 min-w-[18rem] bg-slate-50/50 rounded-xl p-3 border h-full transition-colors",
                isOver && "bg-blue-50/50 border-blue-200"
            )}
        >
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-bold text-sm flex items-center gap-2">
                    {status}
                    <span className="text-xs text-muted-foreground font-normal bg-slate-100 px-1.5 py-0.5 rounded-full">
                        {incomes.length}
                    </span>
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-[100px]">
                {incomes.map((income) => (
                    <KanbanCard key={income.id} income={income} />
                ))}
                {incomes.length === 0 && !isOver && (
                    <div className="h-20 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-[11px] text-slate-400">
                        카드 없음
                    </div>
                )}
            </div>
        </div>
    )
}
