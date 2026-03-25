'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
import { checkProjectIntegrity, ProjectProfitabilityMinimal } from '@/entities/project/lib/integrity';
import { cn } from '@/shared/lib/utils';

interface ProfitabilityAlertProps {
    projects: ProjectProfitabilityMinimal[];
    className?: string;
}

export function ProfitabilityAlert({ projects, className }: ProfitabilityAlertProps) {
    const alerts = projects
        .map(p => ({ project: p, integrity: checkProjectIntegrity(p) }))
        .filter(a => !a.integrity.isHealthy);

    if (alerts.length === 0) return null;

    const criticalCount = alerts.filter(a => a.integrity.level === 'critical').length;
    const warningCount = alerts.filter(a => a.integrity.level === 'warning').length;

    return (
        <Card className={cn("border-none bg-slate-900/40 backdrop-blur-xl overflow-hidden", className)}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "p-1.5 rounded-lg",
                            criticalCount > 0 ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"
                        )}>
                            <AlertTriangle className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-bold text-white">데이터 보정 필요 ({alerts.length}건)</h4>
                    </div>
                </div>
                
                <div className="space-y-2">
                    {alerts.slice(0, 3).map(({ project, integrity }) => (
                        <div key={project.id} className="group flex items-start gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5">
                            <div className={cn(
                                "mt-1 h-1.5 w-1.5 rounded-full shrink-0",
                                integrity.level === 'critical' ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                            )} />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-200 truncate">{project.name}</p>
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {integrity.warnings.map((w, idx) => (
                                        <span key={idx} className="text-[10px] text-slate-400 font-medium">
                                            • {w}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                    {alerts.length > 3 && (
                        <p className="text-[10px] text-slate-500 text-center font-bold tracking-tight py-1">
                            외 {alerts.length - 3}건의 프로젝트 검토 필요
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
