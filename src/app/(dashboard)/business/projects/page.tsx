"use client"

import { useState, useEffect, useCallback } from 'react'
import { Plus, FolderOpen } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { getProjects } from '@/entities/project/api/get-projects'
import { BackButton } from '@/shared/ui/back-button'
import {
    OWNER_TYPES, OWNER_LABELS,
    PROJECT_STATUSES, PROJECT_STATUS_LABELS,
    type OwnerType, type ProjectStatus,
} from '@/shared/constants/business'
import { 
    ProjectCard, 
    CreateProjectModal, 
    ProjectDetailModal,
    type Project 
} from '@/entities/project'
import { cn } from '@/shared/lib/utils'
import { getBusinessProfiles } from '@/features/manage-business-profile/api/business-profile-api'

type OwnerFilter = OwnerType | 'all'

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [profiles, setProfiles] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all')
    const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('active')
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [selectedProject, setSelectedProject] = useState<Project | null>(null)

    const load = useCallback(async () => {
        setIsLoading(true)
        try {
            const [data, profileData] = await Promise.all([
                getProjects(),
                getBusinessProfiles()
            ])
            setProjects(data)
            setProfiles(profileData)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const filtered = projects.filter(p => {
        if (ownerFilter !== 'all' && p.business_owner !== ownerFilter) return false
        if (statusFilter !== 'all' && p.status !== statusFilter) return false
        return true
    })

    function handleCreated(project: Project) {
        setProjects(prev => [project, ...prev])
    }

    function handleUpdated(updated: Project) {
        setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
        if (selectedProject?.id === updated.id) setSelectedProject(updated)
    }

    function handleDeleted(id: string) {
        setProjects(prev => prev.filter(p => p.id !== id))
        setSelectedProject(null)
    }

    const ownerCounts = (OWNER_TYPES as readonly OwnerFilter[]).reduce((acc, o) => {
        acc[o] = projects.filter(p => p.business_owner === o).length
        return acc
    }, {} as Record<OwnerFilter, number>)

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BackButton label="비즈니스" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <FolderOpen className="h-6 w-6 text-blue-500" /> 프로젝트 센터
                        </h1>
                        <p className="text-sm text-muted-foreground">총 {projects.length}개 프로젝트</p>
                    </div>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" /> 새 프로젝트
                </Button>
            </div>

            {/* 필터 */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* 오너 탭 */}
                <Tabs value={ownerFilter} onValueChange={v => setOwnerFilter(v as OwnerFilter)}>
                    <TabsList className="h-9">
                        <TabsTrigger value="all" className="text-xs px-3">
                            전체 <span className="ml-1 text-muted-foreground">{projects.length}</span>
                        </TabsTrigger>
                        {OWNER_TYPES.map(o => (
                            <TabsTrigger key={o} value={o} className="text-xs px-3">
                                {OWNER_LABELS[o]}
                                {ownerCounts[o] > 0 && (
                                    <span className="ml-1 text-muted-foreground">{ownerCounts[o]}</span>
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                {/* 상태 필터 */}
                <div className="flex gap-1.5">
                    {(['all', ...PROJECT_STATUSES] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                'text-xs px-3 py-1.5 rounded-full  transition-colors',
                                statusFilter === s
                                    ? 'bg-slate-800 text-white border-slate-800'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                            )}
                        >
                            {s === 'all' ? '전체' : PROJECT_STATUS_LABELS[s]}
                        </button>
                    ))}
                </div>
            </div>

            {/* 카드 그리드 */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-32 bg-muted/40 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                    <FolderOpen className="h-12 w-12 opacity-20" />
                    <p className="text-sm">해당 조건의 프로젝트가 없습니다.</p>
                    <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(true)}>
                        <Plus className="mr-1.5 h-4 w-4" /> 첫 프로젝트 만들기
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(project => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onSelect={() => setSelectedProject(project)}
                        />
                    ))}
                </div>
            )}

            {/* 모달들 */}
            <CreateProjectModal
                open={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onCreated={handleCreated}
            />

            {selectedProject && (
                <ProjectDetailModal
                    key={selectedProject.id}
                    project={selectedProject}
                    profiles={profiles}
                    open={!!selectedProject}
                    onClose={() => setSelectedProject(null)}
                    onUpdated={handleUpdated}
                    onDeleted={handleDeleted}
                />
            )}
        </div>
    )
}
