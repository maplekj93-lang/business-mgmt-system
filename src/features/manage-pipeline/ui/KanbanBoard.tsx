"use client"

import React, { useState } from 'react'
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { PIPELINE_STATUSES, type PipelineStatus, type OwnerType } from '@/shared/constants/business'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { updateIncomeStatus } from '@/entities/project/api/update-income-status'
import type { ProjectIncome } from '@/entities/project/model/types'
import { toast } from 'sonner'

interface KanbanBoardProps {
    initialIncomes: ProjectIncome[]
}

export function KanbanBoard({ initialIncomes }: KanbanBoardProps) {
    const [incomes, setIncomes] = useState<ProjectIncome[]>(initialIncomes)
    const [activeId, setActiveId] = useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (!over) return

        const incomeId = active.id as string
        const newStatus = over.id as PipelineStatus

        // 동일한 컬럼이면 무시 (정렬 로직은 추후 필요시 추가)
        const income = incomes.find(i => i.id === incomeId)
        if (!income || income.status === newStatus) return

        // 1. UI 즉시 업데이트 (Optimistic Update)
        const prevIncomes = [...incomes]
        setIncomes(prev => prev.map(i =>
            i.id === incomeId ? { ...i, status: newStatus } : i
        ))

        try {
            // 2. DB 업데이트
            await updateIncomeStatus(incomeId, newStatus)
            toast.success(`상태가 '${newStatus}'(으)로 변경되었습니다.`)
        } catch (error) {
            // 3. 실패 시 롤백
            setIncomes(prevIncomes)
            toast.error('상태 변경에 실패했습니다.')
        }
    }

    const activeIncome = activeId ? incomes.find(i => i.id === activeId) : null

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 p-4 overflow-x-auto h-[calc(100vh-12rem)] min-h-[600px] items-start scrollbar-hide">
                {PIPELINE_STATUSES.map((status) => (
                    <KanbanColumn
                        key={status}
                        status={status}
                        incomes={incomes.filter((i) => i.status === status)}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeId && activeIncome ? (
                    <div className="rotate-3 opacity-90 scale-105 pointer-events-none">
                        <KanbanCard income={activeIncome} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
