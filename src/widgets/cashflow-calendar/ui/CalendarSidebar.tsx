'use client';

import React from 'react';
import { TrendingUp, Sparkles, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export function CalendarSidebar() {
    return (
        <div className="w-80 flex flex-col gap-6 h-full">
            {/* Cash Flow Overview (Small Chart Mockup) */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                        <TrendingUp className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-black tracking-widest text-white uppercase">Cash Flow Overview</h3>
                </div>

                <div className="h-24 w-full bg-white/5 rounded-xl border border-white/10 flex items-center justify-center relative overflow-hidden">
                    {/* Simulated Chart Line */}
                    <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0,80 L20,70 L40,85 L60,40 L80,50 L100,20 V100 H0 Z" fill="url(#gradient)" />
                        <defs>
                            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2463eb" />
                                <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest relative z-10">Real-time Trend</span>
                </div>

                <div className="mt-4 flex justify-between">
                    <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-tight">Net Volume</p>
                        <p className="text-sm font-bold text-white tracking-tight">₩4,250,000</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-tight">Growth</p>
                        <p className="text-sm font-bold text-emerald-400">+12.4%</p>
                    </div>
                </div>
            </div>

            {/* AI Forecast Report */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-indigo-500/5 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -mr-16 -mt-16" />

                <div className="flex items-center gap-3 mb-4 relative z-10">
                    <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
                        <Sparkles className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-black tracking-widest text-indigo-400 uppercase">AI Forecast Report</h3>
                </div>

                <p className="text-[11px] text-slate-400 font-bold leading-relaxed relative z-10">
                    Next week, a projected deficit of ₩1.2M is expected due to
                    <span className="text-white italic"> "Recurring Subscriptions"</span>.
                    Immediate liquidity optimization recommended.
                </p>

                <button className="mt-4 w-full py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10">
                    Full AI Audit
                </button>
            </div>

            {/* Recent Movements (Small List) */}
            <div className="flex-1 glass-panel p-6 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl flex flex-col">
                <h3 className="text-xs font-black tracking-widest text-white uppercase mb-6 flex items-center gap-2">
                    Large Movements
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                </h3>

                <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-all text-[11px]">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-1.5 rounded-lg",
                                    i === 1 ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                                )}>
                                    {i === 1 ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                                </div>
                                <div className="space-y-0.5">
                                    <p className="font-bold text-white uppercase truncate w-24">Equipment Purchase</p>
                                    <p className="text-[9px] text-slate-500 font-bold">Oct 12, 2023</p>
                                </div>
                            </div>
                            <span className={cn(
                                "font-black",
                                i === 1 ? "text-rose-400" : "text-emerald-400"
                            )}>
                                {i === 1 ? "-250만" : "+120만"}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
