'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { getProjects } from '@/entities/project/api/get-projects'
import type { Project } from '@/entities/project/model/types'
import { Briefcase, ChevronRight, LayoutGrid } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Loader2 } from 'lucide-react'

export function ProjectBriefList() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const data = await getProjects('active')
                setProjects(data.slice(0, 5))
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading) {
        return (
            <div className="flex h-[300px] items-center justify-center tactile-panel rounded-2xl bg-background">
                <Loader2 className="h-6 w-6 animate-spin text-primary opacity-50" />
            </div>
        )
    }

    return (
        <div className="tactile-panel p-6 rounded-2xl bg-background h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                        <Briefcase className="h-4 w-4" />
                    </div>
                    <h3 className="text-base font-black tracking-tight text-white uppercase">진행 중인 프로젝트</h3>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold bg-white/5 text-slate-400">
                    {projects.length} ACTIVE
                </Badge>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                {projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-xs">
                        <LayoutGrid className="h-8 w-8 mb-2 opacity-20" />
                        진행 중인 프로젝트가 없습니다.
                    </div>
                ) : (
                    projects.map((project) => (
                        <div key={project.id} className="group flex items-center justify-between p-3.5 rounded-xl hover:bg-white/5 transition-all border-transparent hover: cursor-pointer">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/10 transition-all">
                                    <span className="text-xs font-black text-slate-500 group-hover:text-primary transition-colors">
                                        {project.name.charAt(0)}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">
                                        {project.name}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight truncate">
                                        {project.client?.name || '거래처 없음'}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-white transition-colors flex-shrink-0" />
                        </div>
                    ))
                )}
            </div>

            <button className="mt-6 w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                프로젝트 센터로 이동
            </button>
        </div>
    )
}
