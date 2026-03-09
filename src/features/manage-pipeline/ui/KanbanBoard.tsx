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
import { DollarSign, CheckCircle2, Zap, TrendingUp, TrendingDown } from 'lucide-react'

interface KanbanBoardProps {
    initialIncomes: ProjectIncome[]
}

export function KanbanBoard({ initialIncomes }: KanbanBoardProps) {
    const [incomes, setIncomes] = useState<ProjectIncome[]>(initialIncomes)
    const [activeId, setActiveId] = useState<string | null>(null)

    // Calculate summary stats
    const totalPipelineValue = incomes.reduce((sum, item) => sum + item.amount, 0)
    const realizedRevenue = incomes
        .filter(item => item.status === '입금완료')
        .reduce((sum, item) => sum + item.amount, 0)
    const avgProjectSpeed = 12.4 // Mocked for now

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

        const income = incomes.find(i => i.id === incomeId)
        if (!income || income.status === newStatus) return

        const prevIncomes = [...incomes]
        setIncomes(prev => prev.map(i =>
            i.id === incomeId ? { ...i, status: newStatus } : i
        ))

        try {
            await updateIncomeStatus(incomeId, newStatus)
            toast.success(`상태가 '${newStatus}'(으)로 변경되었습니다.`)
        } catch (error) {
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
            <div className="space-y-8 h-full flex flex-col">
                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Pipeline Value</p>
                            <div className="bg-primary/10 p-2 rounded-lg text-primary shadow-sm ring-1 ring-primary/20">
                                <DollarSign className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="text-3xl font-black tracking-tighter text-white">₩{totalPipelineValue.toLocaleString()}</p>
                        <div className="flex items-center gap-1.5 mt-2">
                            <TrendingUp className="h-3 w-3 text-emerald-400" />
                            <p className="text-emerald-400 text-[10px] font-bold">+12.4% vs last month</p>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl transition-all group-hover:bg-emerald-500/20" />
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Revenue Realized</p>
                            <div className="bg-emerald-400/10 p-2 rounded-lg text-emerald-400 shadow-sm ring-1 ring-emerald-400/20">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="text-3xl font-black tracking-tighter text-white">₩{realizedRevenue.toLocaleString()}</p>
                        <div className="flex items-center gap-1.5 mt-2">
                            <TrendingDown className="h-3 w-3 text-rose-400" />
                            <p className="text-rose-400 text-[10px] font-bold">-5.2% vs last month</p>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl transition-all group-hover:bg-amber-500/20" />
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Avg Project Speed</p>
                            <div className="bg-amber-500/10 p-2 rounded-lg text-amber-500 shadow-sm ring-1 ring-amber-500/20">
                                <Zap className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="text-3xl font-black tracking-tighter text-white">{avgProjectSpeed} Days</p>
                        <div className="flex items-center gap-1.5 mt-2">
                            <TrendingUp className="h-3 w-3 text-emerald-400" />
                            <p className="text-emerald-400 text-[10px] font-bold">+2.1% faster</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 overflow-x-auto min-h-[500px] items-start scrollbar-hide flex-1">
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
            </div>
        </DndContext>
    )
}
