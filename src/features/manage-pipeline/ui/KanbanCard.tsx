"use client"

import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Calendar, User, Building2 } from 'lucide-react'
import { OWNER_LABELS, OWNER_COLORS, PIPELINE_STATUSES } from '@/shared/constants/business'
import type { ProjectIncome } from '@/entities/project/model/types'
import { cn } from '@/shared/lib/utils'

interface KanbanCardProps {
    income: ProjectIncome
}

export function KanbanCard({ income }: KanbanCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: income.id,
        data: income,
    })

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined

    const owner = income.project?.business_owner || 'kwangjun'
    const ownerLabel = OWNER_LABELS[owner as keyof typeof OWNER_LABELS]
    const ownerColor = OWNER_COLORS[owner as keyof typeof OWNER_COLORS]

    // Calculate progress based on status index
    const statusIndex = PIPELINE_STATUSES.indexOf(income.status as any)
    const progress = Math.max(10, Math.min(100, ((statusIndex + 1) / PIPELINE_STATUSES.length) * 100))

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn(
                "group relative cursor-grab active:cursor-grabbing hover:-translate-y-1 transition-all duration-300 mb-4",
                isDragging && "opacity-50 ring-2 ring-primary scale-105 z-50 "
            )}
        >
            <Card className={cn(
                "overflow-hidden  bg-slate-900/60  shadow-sm transition-all group-hover: group-hover:bg-slate-900/80 border-l-[6px]",
                ownerColor.replace('bg-', 'border-')
            )}>
                <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start gap-3">
                        <CardTitle className="text-[13px] font-black leading-tight tracking-tight text-white group-hover:text-primary transition-colors line-clamp-2 uppercase">
                            {income.project?.name || '제목 없음'}
                        </CardTitle>
                        <Badge variant="secondary" className="text-[9px] px-1.5 h-4.5 shrink-0 bg-white/5 font-black text-slate-400 uppercase">
                            {income.title}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="p-4 pt-0 space-y-4">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                        <div className="h-6 w-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                            <Building2 className="h-3 w-3" />
                        </div>
                        <span className="truncate uppercase tracking-tight">{income.project?.client?.name || '거래처 없음'}</span>
                    </div>

                    {/* Progress Bar Section */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                            <span className="text-slate-500">프로젝트 진행률</span>
                            <span className="text-primary">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={cn("h-full transition-all duration-1000 ease-out", ownerColor)}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    <div className="pt-3 flex justify-between items-end border-t">
                        <div className="space-y-0.5">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">예상 수입</span>
                            <div className="flex items-center gap-1.5 text-sm font-black text-white">
                                <span className="text-[10px] text-slate-500 opacity-70">₩</span>
                                {income.amount.toLocaleString()}
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            {income.expected_date && (
                                <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 bg-white/5 px-2 py-1 rounded-lg">
                                    <Calendar className="h-3 w-3 opacity-60 text-primary" />
                                    {income.expected_date.split('-').slice(1).join('/')}
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <span className="text-[8px] font-black text-slate-600 uppercase">{ownerLabel}</span>
                                <div className="relative">
                                    <div className={cn("w-6 h-6 rounded-lg ring-2 ring-white/10 overflow-hidden", ownerColor)}>
                                        <div className="w-full h-full bg-black/20 flex items-center justify-center">
                                            <span className="text-[10px] font-black text-white">{ownerLabel[0]}</span>
                                        </div>
                                    </div>
                                    <div className={cn("absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-slate-900", ownerColor)} />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Hover Glow Effect */}
            <div className={cn(
                "absolute -inset-1 rounded-[20px] blur-xl opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none -z-10",
                ownerColor
            )} />
        </div>
    )
}
