"use client"

import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Calendar, User, Building2 } from 'lucide-react'
import { OWNER_LABELS, OWNER_COLORS } from '@/shared/constants/business'
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

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn(
                "cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow mb-3 border-l-4",
                ownerColor.replace('bg-', 'border-'),
                isDragging && "opacity-50 ring-2 ring-blue-500"
            )}
        >
            <CardHeader className="p-3 pb-1">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-sm font-bold leading-tight line-clamp-2">
                        {income.project?.name || '제목 없음'}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] px-1 h-4 shrink-0">
                        {income.title}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-3 pt-1 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    <span className="truncate">{income.project?.client?.name || '거래처 정보 없음'}</span>
                </div>

                <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-blue-600">
                        <span className="text-xs">₩</span>
                        {income.amount.toLocaleString()}
                    </div>

                    <div className="flex items-center gap-1.5">
                        {income.expected_date && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {income.expected_date.split('-').slice(1).join('/')}
                            </div>
                        )}
                        <div className={cn("w-2 h-2 rounded-full", ownerColor)} title={ownerLabel} />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
