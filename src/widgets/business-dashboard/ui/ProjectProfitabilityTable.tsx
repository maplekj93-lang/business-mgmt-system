import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow as TableTableRow } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { calculateProjectNetProfit, formatKrw, calculateProfitMargin } from '@/shared/lib/currency';
import { TrendingUp, Loader2 } from 'lucide-react';

interface ProjectProfitability {
    id: string;
    name: string;
    revenue: number;
    labor_cost: number;
    expenses: number;
    net_profit: number;
    profit_margin: number;
    status: 'active' | 'completed' | 'on_hold';
}

interface ProjectProfitabilityTableProps {
    projects: ProjectProfitability[];
    loading?: boolean;
}

export function ProjectProfitabilityTable({ projects, loading }: ProjectProfitabilityTableProps) {
    if (loading) {
        return (
            <div className="flex h-[300px] items-center justify-center tactile-panel rounded-2xl bg-background">
                <Loader2 className="h-6 w-6 animate-spin text-primary opacity-50" />
            </div>
        );
    }

    return (
        <div className="tactile-panel p-6 rounded-2xl bg-background h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-500">
                        <TrendingUp className="h-4 w-4" />
                    </div>
                    <h3 className="text-base font-black tracking-tight text-white uppercase">프로젝트 수익성 분석</h3>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold bg-white/5 text-slate-400 border-none">
                    부가세 10% 제외
                </Badge>
            </div>

            <div className="flex-1 overflow-x-auto custom-scrollbar">
                <Table>
                    <TableHeader>
                        <TableTableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">프로젝트</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-500">매출</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-rose-500/70">지출</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-emerald-500">실질순익</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-500">수익률</TableHead>
                        </TableTableRow>
                    </TableHeader>
                    <TableBody>
                        {projects.length === 0 ? (
                            <TableTableRow className="border-none hover:bg-transparent">
                                <TableCell colSpan={5} className="h-40 text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                                    데이터가 없습니다.
                                </TableCell>
                            </TableTableRow>
                        ) : (
                            projects.map((project) => {
                                const totalExpense = project.labor_cost + project.expenses;
                                
                                return (
                                    <TableTableRow key={project.id} className="border-white/5 hover:bg-white/5 transition-all">
                                        <TableCell className="text-xs font-bold text-white truncate max-w-[120px]">
                                            {project.name}
                                        </TableCell>
                                        <TableCell className="text-right text-xs font-bold text-slate-300">
                                            {formatKrw(project.revenue)}
                                        </TableCell>
                                        <TableCell className="text-right text-xs font-bold text-rose-400">
                                            -{formatKrw(totalExpense)}
                                        </TableCell>
                                        <TableCell className="text-right text-xs font-black text-emerald-400">
                                            {formatKrw(project.net_profit)}
                                        </TableCell>
                                        <TableCell className="text-right text-[10px] font-black text-slate-500">
                                            {project.profit_margin}%
                                        </TableCell>
                                    </TableTableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
