'use client';

import React from 'react';
import { Users, MoreHorizontal } from 'lucide-react';

// Mock data based on Stitch design
const MOCK_CREW = [
    { id: 1, name: 'Alex River', role: 'Project Lead', status: 'online', avatar: 'https://i.pravatar.cc/150?u=alex' },
    { id: 2, name: 'Sarah Chen', role: 'Lead Designer', status: 'online', avatar: 'https://i.pravatar.cc/150?u=sarah' },
    { id: 3, name: 'Michael Ross', role: 'DevOps Engineer', status: 'offline', avatar: 'https://i.pravatar.cc/150?u=michael' },
    { id: 4, name: 'Emma Watson', role: 'Product Manager', status: 'online', avatar: 'https://i.pravatar.cc/150?u=emma' },
];

export function RecentCrew() {
    return (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                        <Users className="h-4 w-4" />
                    </div>
                    <h3 className="text-base font-black tracking-tight text-white uppercase">Recent Crew</h3>
                </div>
                <button className="text-slate-500 hover:text-white transition-colors">
                    <MoreHorizontal className="h-5 w-5" />
                </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
                {MOCK_CREW.map((member) => (
                    <div key={member.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="h-10 w-10 rounded-full border-2 border-primary/20 p-0.5 overflow-hidden">
                                    <img src={member.avatar} alt={member.name} className="h-full w-full rounded-full object-cover" />
                                </div>
                                <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-900 ${member.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'
                                    }`} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{member.name}</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{member.role}</p>
                            </div>
                        </div>
                        <button className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white transition-all">
                            View
                        </button>
                    </div>
                ))}
            </div>

            <button className="mt-6 w-full py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                Manage Team
            </button>
        </div>
    );
}
