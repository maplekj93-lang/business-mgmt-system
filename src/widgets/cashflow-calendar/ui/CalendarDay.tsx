'use client';

import React from 'react';
import { cn } from '@/shared/lib/utils';
import { isSameMonth, isSameDay, isToday, format } from 'date-fns';

interface CalendarDayProps {
    day: Date;
    currentMonth: Date;
    inflow?: number;
    outflow?: number;
    dutchPay?: number;
    isSelected?: boolean;
    onClick?: (day: Date) => void;
}

export function CalendarDay({ day, currentMonth, inflow, outflow, dutchPay, isSelected, onClick }: CalendarDayProps) {
    const isCurrentMonth = isSameMonth(day, currentMonth);
    const isDayToday = isToday(day);

    return (
        <div
            onClick={() => onClick?.(day)}
            className={cn(
                "group relative min-h-[100px] p-2 bg-background/50   transition-all hover:bg-white/[0.04] cursor-pointer",
                !isCurrentMonth && "opacity-30 grayscale-[50%]",
                isSelected && "bg-primary/10 border-primary/30 z-10 ring-1 ring-primary/20",
                isDayToday && "bg-white/[0.02]"
            )}
        >
            <div className="flex justify-between items-start">
                <span className={cn(
                    "text-xs font-black tracking-tighter",
                    isDayToday ? "text-primary h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center -ml-1 -mt-1" : "text-slate-400"
                )}>
                    {format(day, 'd')}
                </span>
                <div className="flex gap-1">
                    {inflow && inflow > 0 && (
                        <div className="h-1.5 w-1.5 bg-sky-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                    )}
                    {dutchPay && dutchPay > 0 && (
                        <div className="h-1.5 w-1.5 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                    )}
                </div>
            </div>

            <div className="mt-auto space-y-1 pt-4">
                {inflow && inflow > 0 && (
                    <div className="flex items-center gap-1">
                        <div className="h-1 w-2 bg-sky-400/30 rounded" />
                        <span className="text-[10px] font-black text-sky-400">
                            +{(inflow / 10000).toFixed(0)}만
                        </span>
                    </div>
                )}
                {outflow && outflow > 0 && (
                    <div className="flex items-center gap-1">
                        <div className="h-1 w-2 bg-rose-500/30 rounded" />
                        <span className="text-[10px] font-black text-rose-400">
                            -{(outflow / 10000).toFixed(0)}만
                        </span>
                    </div>
                )}
                {dutchPay && dutchPay > 0 && (
                    <div className="flex items-center gap-1">
                        <div className="h-1 w-2 bg-orange-500/30 rounded" />
                        <span className="text-[10px] font-black text-orange-400">
                            {(dutchPay / 10000).toFixed(0)}만
                        </span>
                    </div>
                )}
            </div>

            {/* Hover Indicator */}
            <div className="absolute inset-0 border-2 border-white/0 group-hover: transition-all rounded-sm pointer-events-none" />
        </div>
    );
}
