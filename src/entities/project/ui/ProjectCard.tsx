"use client"

import React from 'react'
import { Badge } from '@/shared/ui/badge'
import { OWNER_LABELS, OWNER_COLORS, PROJECT_STATUS_LABELS, type ProjectStatus } from '@/shared/constants/business'
import type { Project, ChecklistItem } from '../model/types'
import { cn } from '@/shared/lib/utils'

const STATUS_COLORS: Record<ProjectStatus, string> = {
    active: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
    on_hold: 'bg-amber-100 text-amber-700 border-amber-200',
}

const PIPELINE_DONE_STATUSES = ['입금완료', '포스팅완료']

function checklistProgress(items: ChecklistItem[]) {
    if (!items?.length) return null
    return { done: items.filter(i => i.done).length, total: items.length }
}

function latestPipelineStatus(project: Project) {
    const incomes = project.project_incomes ?? []
    if (!incomes.length) return null
    const active = incomes.find(i => !PIPELINE_DONE_STATUSES.includes(i.status))
    return active?.status ?? incomes[incomes.length - 1]?.status ?? null
}

interface ProjectCardProps {
    project: Project
    onSelect: () => void
}

export function ProjectCard({ project, onSelect }: ProjectCardProps) {
    const progress = checklistProgress(project.checklist)
    const pipelineStatus = latestPipelineStatus(project)
    const ownerColor = OWNER_COLORS[project.business_owner] ?? 'bg-gray-400'

    return (
        <div
            onClick={onSelect}
            className="bg-white rounded-xl p-4 hover:shadow-md hover:border-blue-200 cursor-pointer transition-all space-y-3 group"
        >
            {/* 헤더: 오너 색상 바 + 이름 */}
            <div className="flex items-start gap-3">
                <div className={cn('w-1 self-stretch rounded-full flex-shrink-0', ownerColor)} />
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight truncate group-hover:text-blue-700">{project.name}</p>
                    {project.client?.name && (
                        <p className="text-xs text-muted-foreground mt-0.5">{project.client.name}</p>
                    )}
                </div>
                <Badge className={cn('text-[10px] px-1.5 shrink-0 border', STATUS_COLORS[project.status])}>
                    {PROJECT_STATUS_LABELS[project.status]}
                </Badge>
            </div>

            {/* 카테고리 태그 */}
            {project.categories?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {project.categories.slice(0, 3).map(c => (
                        <span key={c} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{c}</span>
                    ))}
                    {project.categories.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{project.categories.length - 3}</span>
                    )}
                </div>
            )}

            {/* 하단: 파이프라인 + 체크리스트 */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    {pipelineStatus && (
                        <span className={cn(
                            'px-1.5 py-0.5 rounded text-[10px] font-medium',
                            PIPELINE_DONE_STATUSES.includes(pipelineStatus)
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-orange-50 text-orange-700'
                        )}>{pipelineStatus}</span>
                    )}
                    <span className="text-[10px] text-slate-400">
                        {OWNER_LABELS[project.business_owner]}
                    </span>
                </div>
                {progress && (
                    <span className={cn(
                        'text-[10px] font-medium',
                        progress.done === progress.total ? 'text-emerald-600' : 'text-muted-foreground'
                    )}>
                        {progress.done === progress.total ? '✓' : ''} {progress.done}/{progress.total} 완료
                    </span>
                )}
            </div>
        </div>
    )
}
