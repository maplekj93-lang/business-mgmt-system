'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { PieChart as PieIcon, Loader2 } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { formatKrw } from '@/shared/lib/currency'

interface CategoryData {
    name: string;
    value: number;
    color?: string;
}

interface CategoryDonutChartProps {
    data: CategoryData[];
    loading?: boolean;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function CategoryDonutChart({ data, loading }: CategoryDonutChartProps) {
    if (loading) {
        return (
            <div className="flex h-[300px] items-center justify-center tactile-panel rounded-2xl bg-background">
                <Loader2 className="h-6 w-6 animate-spin text-primary opacity-50" />
            </div>
        );
    }

    const isEmpty = data.length === 0 || data.every(d => d.value === 0);

    return (
        <div className="tactile-panel p-6 rounded-2xl bg-background h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                        <PieIcon className="h-4 w-4" />
                    </div>
                    <h3 className="text-base font-black tracking-tight text-white uppercase">지출 카테고리 분석</h3>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold bg-white/5 text-slate-400 border-none">
                    분기별 지출 비중
                </Badge>
            </div>

            <div className="flex-1 min-h-[240px] relative">
                {isEmpty ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                        데이터가 없습니다.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.05)" />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#0f172a', 
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    color: '#fff'
                                }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: number) => formatKrw(value)}
                            />
                            <Legend 
                                verticalAlign="bottom" 
                                height={36}
                                iconType="circle"
                                iconSize={8}
                                formatter={(value) => <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
