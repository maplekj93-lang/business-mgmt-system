'use client';

import React from 'react';
import { Card, CardContent } from '@/shared/ui/card';
import { ProjectProfitabilityData } from '@/entities/project/api/get-project-analytics';
import { Scale, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface ProfitBalanceCardProps {
    projects: ProjectProfitabilityData[];
    className?: string;
}

export function ProfitBalanceCard({ projects, className }: ProfitBalanceCardProps) {
    const kwangjunProfit = projects
        .filter(p => p.owner_id === 'kwangjun')
        .reduce((sum, p) => sum + p.net_profit, 0);
    
    const euiyoungProfit = projects
        .filter(p => p.owner_id === 'euiyoung')
        .reduce((sum, p) => sum + p.net_profit, 0);

    const totalProfit = kwangjunProfit + euiyoungProfit;
    const kwangjunShare = totalProfit > 0 ? (kwangjunProfit / totalProfit) * 100 : 50;
    const euiyoungShare = totalProfit > 0 ? (euiyoungProfit / totalProfit) * 100 : 50;
    
    const diff = Math.abs(kwangjunProfit - euiyoungProfit);
    const isBalanced = diff < 500000; // 50만원 이내면 균형으로 간주

    return (
        <div className={cn("group relative overflow-hidden rounded-2xl bg-background p-6 transition-all hover:bg-slate-900/60 hover:shadow-indigo-500/20", className)}>
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl transition-all group-hover:bg-indigo-500/20" />
            
            <div className="flex items-center justify-between mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">수익 균형 (Profit Share)</p>
                <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-500 shadow-sm ring-1 ring-indigo-500/20">
                    <Scale className="h-5 w-5" />
                </div>
            </div>

            <div className="space-y-6">
                {/* Visual Bar */}
                <div className="relative h-4 w-full rounded-full bg-slate-800/50 overflow-hidden flex">
                    <div 
                        className="h-full bg-indigo-500 transition-all duration-1000 ease-out relative group/kwang"
                        style={{ width: `${kwangjunShare}%` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10" />
                    </div>
                    <div 
                        className="h-full bg-emerald-500 transition-all duration-1000 ease-out relative group/eui"
                        style={{ width: `${euiyoungShare}%` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white/10" />
                    </div>
                    
                    {/* Mid Point */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-0 border-r border-dashed border-white/20 z-10" />
                </div>

                {/* Legend & Details */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-indigo-500" />
                            <span className="text-[10px] font-bold text-slate-400">광준</span>
                        </div>
                        <p className="text-lg font-black text-white">
                            <span className="text-xs font-bold text-slate-500 mr-0.5">₩</span>
                            {kwangjunProfit.toLocaleString()}
                        </p>
                        <p className="text-[10px] font-bold text-indigo-400">{kwangjunShare.toFixed(1)}%</p>
                    </div>

                    <div className="space-y-1 text-right">
                        <div className="flex items-center gap-2 justify-end">
                            <span className="text-[10px] font-bold text-slate-400">의영</span>
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        </div>
                        <p className="text-lg font-black text-white">
                            <span className="text-xs font-bold text-slate-500 mr-0.5">₩</span>
                            {euiyoungProfit.toLocaleString()}
                        </p>
                        <p className="text-[10px] font-bold text-emerald-400">{euiyoungShare.toFixed(1)}%</p>
                    </div>
                </div>

                {/* Status Indicator */}
                <div className={cn(
                    "flex items-center justify-center gap-2 p-2 rounded-xl text-[10px] font-bold border",
                    isBalanced 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                )}>
                    {isBalanced ? (
                        <>
                            <TrendingUp className="h-3 w-3" />
                            수익 균형 상태입니다
                        </>
                    ) : (
                        <>
                            <TrendingDown className="h-3 w-3" />
                            수익 정산 보정이 필요할 수 있습니다 (차액: {diff.toLocaleString()}원)
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
