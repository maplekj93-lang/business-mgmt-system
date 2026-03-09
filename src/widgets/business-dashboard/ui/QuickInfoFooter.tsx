'use client';

import React from 'react';
import { Calendar, CheckCircle2, AlertCircle, Zap } from 'lucide-react';

export function QuickInfoFooter() {
    return (
        <div className="glass-panel mt-8 p-1 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10">
                {/* Upcoming Payroll */}
                <div className="p-4 flex items-center gap-4 group cursor-pointer hover:bg-white/5 transition-all">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary group-hover:scale-110 transition-transform">
                        <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Upcoming Payroll</p>
                        <p className="text-sm font-bold text-white">Oct 15, 2023</p>
                    </div>
                </div>

                {/* Overdue Tasks */}
                <div className="p-4 flex items-center gap-4 group cursor-pointer hover:bg-white/5 transition-all">
                    <div className="bg-rose-500/10 p-2 rounded-lg text-rose-500 group-hover:scale-110 transition-transform">
                        <AlertCircle className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Overdue Tasks</p>
                        <p className="text-sm font-bold text-white">3 Critical Items</p>
                    </div>
                </div>

                {/* Project Health */}
                <div className="p-4 flex items-center gap-4 group cursor-pointer hover:bg-white/5 transition-all">
                    <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-500 group-hover:scale-110 transition-transform">
                        <Zap className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Project Health</p>
                        <p className="text-sm font-bold text-white text-emerald-400">98% Optimal</p>
                    </div>
                </div>

                {/* Last Audit */}
                <div className="p-4 flex items-center gap-4 group cursor-pointer hover:bg-white/5 transition-all">
                    <div className="bg-amber-500/10 p-2 rounded-lg text-amber-500 group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Security Audit</p>
                        <p className="text-sm font-bold text-white">Verified Today</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
