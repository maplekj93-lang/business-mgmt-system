'use client';

import React, { useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { DashboardStats } from '@/entities/transaction/api/get-monthly-stats';
import { ChevronDown } from 'lucide-react';

interface RevenueAnalysisProps {
    data: DashboardStats['trend'];
}

export function RevenueAnalysis({ data }: RevenueAnalysisProps) {
    const [viewMode, setViewMode] = useState<'monthly' | 'quarterly'>('monthly');

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW',
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatYAxis = (value: number) => {
        if (value === 0) return '0';
        return `${(value / 10000).toLocaleString()}만`;
    };

    return (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-lg font-black tracking-tight text-white uppercase">Revenue Analysis</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Growth & Velocity</p>
                </div>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setViewMode('monthly')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'monthly' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setViewMode('quarterly')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'quarterly' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Quarterly
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey={(item) => `${item.month}월`}
                            stroke="rgba(255,255,255,0.3)"
                            fontSize={10}
                            fontWeight="bold"
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.3)"
                            fontSize={10}
                            fontWeight="bold"
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={formatYAxis}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                backdropFilter: 'blur(16px)',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                            }}
                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                            formatter={(value: any) => [formatCurrency(value), '매출']}
                            labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '4px', fontWeight: 'bold' }}
                        />
                        <Bar
                            dataKey="income"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={40}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={index === data.length - 1 ? '#3b82f6' : 'rgba(59, 130, 246, 0.3)'}
                                    className="transition-all duration-500"
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
