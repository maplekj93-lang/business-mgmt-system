"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Progress } from '@/shared/ui/progress'
import { ShieldCheck, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface MatchingHealthProps {
    pendingCount: number;
    totalCount: number;
}

export function MatchingHealthWidget({ pendingCount, totalCount }: MatchingHealthProps) {
    const matchedCount = totalCount - pendingCount;
    const percentage = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 100;

    const getStatusColor = () => {
        if (percentage >= 95) return "text-emerald-400";
        if (percentage >= 80) return "text-amber-400";
        return "text-rose-400";
    };

    const getStatusMessage = () => {
        if (percentage >= 95) return "매우 건강함";
        if (percentage >= 80) return "확인 필요";
        return "관리가 시급함";
    };

    return (
        <Card className="border-none bg-slate-900/40 backdrop-blur-xl shadow-2xl ring-1 ring-white/10 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-200">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    매칭 건강도 (2026)
                </CardTitle>
                <div className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 ring-1 ring-white/10", getStatusColor())}>
                    {getStatusMessage()}
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <p className="text-2xl font-black text-white">{percentage}%</p>
                        <p className="text-[10px] text-slate-500 font-medium tracking-tight">
                            {matchedCount} / {totalCount} 매칭 완료
                        </p>
                    </div>
                </div>

                <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold inline-block text-slate-400 uppercase">
                                가상 자산 건전성
                            </span>
                        </div>
                    </div>
                    <Progress value={percentage} className="h-1.5 bg-white/5" />
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
                    <Info className="h-3 w-3 text-slate-500" />
                    <p className="text-[9px] text-slate-500 leading-tight">
                        미확정 내역이 많아질수록 2026년 세무 예측도가 낮아집니다.
                        <span className="text-primary cursor-pointer hover:underline ml-1">액션 센터 바로가기</span>
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
