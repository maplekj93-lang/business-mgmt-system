'use client';

import React from 'react';
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format
} from 'date-fns';
import { CalendarDay } from './CalendarDay';

interface CalendarGridProps {
    currentMonth: Date;
    data: Record<string, { inflow: number; outflow: number; dutchPay?: number }>;
    selectedDate?: Date;
    onDateSelect?: (date: Date) => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarGrid({ currentMonth, data, selectedDate, onDateSelect }: CalendarGridProps) {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    return (
        <div className="flex-1 overflow-hidden flex flex-col tactile-panel rounded-2xl bg-background">
            {/* Header: Days of Week */}
            <div className="grid grid-cols-7 border-b bg-white/[0.02]">
                {DAYS_OF_WEEK.map((day) => (
                    <div key={day} className="py-3 text-center border-r last:border-r-0">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            {day}
                        </span>
                    </div>
                ))}
            </div>

            {/* Grid: 7 columns */}
            <div className="grid grid-cols-7 grid-flow-row flex-1 overflow-y-auto custom-scrollbar">
                {calendarDays.map((day) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayData = data[dateKey] || { inflow: 0, outflow: 0 };

                    return (
                        <CalendarDay
                            key={dateKey}
                            day={day}
                            currentMonth={currentMonth}
                            inflow={dayData.inflow}
                            outflow={dayData.outflow}
                            dutchPay={dayData.dutchPay}
                            isSelected={selectedDate ? format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') : false}
                            onClick={onDateSelect}
                        />
                    );
                })}
            </div>
        </div>
    );
}
