import React, { useEffect, useState } from 'react';
import { Users, MoreHorizontal, Loader2 } from 'lucide-react';
import { getRecentCrew, RecentCrewMember } from '@/entities/daily-rate/api/get-recent-crew';

export function RecentCrew() {
    const [crew, setCrew] = useState<RecentCrewMember[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const result = await getRecentCrew()
                if (result.success) {
                    setCrew(result.data)
                }
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    return (
        <div className="tactile-panel p-6 rounded-2xl bg-background h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                        <Users className="h-4 w-4" />
                    </div>
                    <h3 className="text-base font-black tracking-tight text-white uppercase">최근 함께한 크루</h3>
                </div>
                <button className="text-slate-500 hover:text-white transition-colors">
                    <MoreHorizontal className="h-5 w-5" />
                </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="h-6 w-6 animate-spin text-primary opacity-50" />
                    </div>
                ) : crew.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-slate-500 text-xs">
                        데이터가 없습니다.
                    </div>
                ) : (
                    crew.map((member) => (
                        <div key={member.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all border-transparent hover:">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="h-10 w-10 rounded-full border-2 border-primary/20 p-0.5 overflow-hidden">
                                        <img src={member.avatar_url} alt={member.name} className="h-full w-full rounded-full object-cover" />
                                    </div>
                                    <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-900 ${member.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'
                                        }`} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{member.name}</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{member.role}</p>
                                </div>
                            </div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase">
                                {member.last_activity.split('-').slice(1).join('/')}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <button className="mt-6 w-full py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                팀 관리
            </button>
        </div>
    );
}
