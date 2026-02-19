'use client';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { SummaryStats } from '@/entities/transaction/model/stats-schema';

export function TrendChart({ data }: { data: SummaryStats }) {
    // Format Y-Axis (e.g., 1000000 -> 100만원 or 1.0M)
    const formatYAxis = (tickItem: number) => {
        if (tickItem === 0) return '0';
        return `${(tickItem / 10000).toLocaleString()}만`;
    };

    const formatTooltip = (value: number | undefined | any) => {
        if (typeof value !== 'number') return '';
        return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value);
    };

    return (
        <div className="glass-panel p-6 h-[400px] flex flex-col">
            <h3 className="text-lg font-semibold mb-6">월별 자산 흐름</h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.trend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey={(item) => `${item.year}.${item.month}`}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={formatYAxis}
                        />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--background) / 0.8)',
                                borderColor: 'hsl(var(--border))',
                                borderRadius: '8px',
                                backdropFilter: 'blur(8px)',
                            }}
                            formatter={formatTooltip}
                        />
                        {/* Using CSS variables for colors */}
                        <Bar dataKey="income" fill="#3b82f6" name="수입" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" fill="#ef4444" name="지출" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
