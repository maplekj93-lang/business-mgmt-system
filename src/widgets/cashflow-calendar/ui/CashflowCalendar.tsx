'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth
} from 'date-fns';
import { ChevronLeft, ChevronRight, Filter, Download, Plus } from 'lucide-react';
import { CalendarGrid } from './CalendarGrid';
import { CalendarSidebar } from './CalendarSidebar';
import { getTransactions } from '@/entities/transaction/api/get-transactions';
import { getPipelineIncomes } from '@/entities/project/api/get-pipeline';
import { Button } from '@/shared/ui/button';

export function CashflowCalendar() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [historicalData, setHistoricalData] = useState<any[]>([]);
    const [pipelineData, setPipelineData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const year = currentMonth.getFullYear();
                const month = currentMonth.getMonth() + 1;

                // Concurrent fetching
                const [txs, pipeline] = await Promise.all([
                    getTransactions({ year, month, mode: 'business', limit: 300 }),
                    getPipelineIncomes('all') // Pipeline is relatively small, fetch all and filter client-side
                ]);

                setHistoricalData(txs);
                setPipelineData(pipeline);
            } catch (error) {
                console.error('Failed to fetch calendar data:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [currentMonth]);

    // Map data to calendar grid
    const mappedData = useMemo(() => {
        const data: Record<string, { inflow: number; outflow: number }> = {};

        // 1. Process Historical Transactions
        historicalData.forEach(tx => {
            const dateStr = tx.date; // assuming ISO date string
            if (!data[dateStr]) data[dateStr] = { inflow: 0, outflow: 0 };

            if (tx.category?.type === 'income') {
                data[dateStr].inflow += tx.amount;
            } else if (tx.category?.type === 'expense') {
                data[dateStr].outflow += tx.amount;
            }
        });

        // 2. Process Planned Income (Pipeline)
        pipelineData.forEach(income => {
            if (!income.expected_date) return;
            const dateStr = income.expected_date;
            if (!data[dateStr]) data[dateStr] = { inflow: 0, outflow: 0 };

            // Expected income contributes to inflow
            data[dateStr].inflow += income.amount;
        });

        return data;
    }, [historicalData, pipelineData]);

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const handleToday = () => {
        const today = new Date();
        setCurrentMonth(today);
        setSelectedDate(today);
    };

    return (
        <div className="flex flex-col gap-8 h-full min-h-[800px] animate-in fade-in duration-700">
            {/* Calendar Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1 bg-white/5 rounded-2xl p-1 shadow-inner">
                        <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-9 w-9 rounded-xl hover:bg-white/10">
                            <ChevronLeft className="h-4 w-4 text-slate-400" />
                        </Button>
                        <div className="px-6 text-center min-w-[140px]">
                            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">
                                {format(currentMonth, 'MMMM yyyy')}
                            </h2>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-9 w-9 rounded-xl hover:bg-white/10">
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                        </Button>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={handleToday}
                        className="text-[10px] font-black uppercase tracking-widest text-primary border-primary/20 hover:bg-primary/10 rounded-xl px-6"
                    >
                        Today
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-white/5 rounded-2xl p-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/10">
                            <Filter className="h-4 w-4 text-slate-400" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/10">
                            <Download className="h-4 w-4 text-slate-400" />
                        </Button>
                    </div>
                    <Button className="bg-primary hover:bg-primary/80 rounded-2xl h-11 px-8 shadow-primary/20 font-black uppercase text-[11px] tracking-widest">
                        <Plus className="mr-2 h-4 w-4" /> New Plan
                    </Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 flex-1">
                {/* Main Grid */}
                <div className="flex-1 min-h-[600px] relative">
                    {isLoading && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/40 rounded-2xl">
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] animate-pulse">Syncing Vault Data</span>
                            </div>
                        </div>
                    )}
                    <CalendarGrid
                        currentMonth={currentMonth}
                        data={mappedData}
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                    />
                </div>

                {/* Right Sidebar */}
                <CalendarSidebar />
            </div>
        </div>
    );
}
