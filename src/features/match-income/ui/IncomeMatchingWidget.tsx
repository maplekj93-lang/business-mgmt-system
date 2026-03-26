'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { HandCoins, ChevronRight, Loader2, Link as LinkIcon, AlertCircle } from 'lucide-react'
import { getPendingIncomes, PendingIncome } from '../api/get-pending-incomes'
import { MatchIncomeDialog } from './MatchIncomeDialog'
import { cn } from '@/shared/lib/utils'

export function IncomeMatchingWidget() {
    const [items, setItems] = useState<PendingIncome[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedItem, setSelectedItem] = useState<PendingIncome | null>(null)

    const fetchItems = async () => {
        setLoading(true)
        const res = await getPendingIncomes()
        if (res.success && res.data) {
            setItems(res.data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchItems()
    }, [])

    if (loading) {
        return (
            <Card className="border-none bg-slate-900/40 backdrop-blur-xl">
                <CardContent className="flex h-[180px] items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-400/40" />
                        <span className="text-[10px] text-indigo-400/40 font-medium">내역을 불러오는 중...</span>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!items || items.length === 0) {
        return (
            <Card className="border-none bg-slate-900/40 backdrop-blur-xl overflow-hidden group">
                <CardHeader className="relative pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-200">
                        <div className="rounded-lg bg-indigo-500/10 p-1.5 ring-1 ring-indigo-500/20">
                            <HandCoins className="h-4 w-4 text-indigo-400" />
                        </div>
                        미정산 입금 매칭
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[120px] flex flex-col items-center justify-center text-center">
                    <p className="text-xs text-slate-500">매칭이 필요한 내역이 모두 처리되었습니다.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card className="border-none bg-indigo-900/10 backdrop-blur-xl shadow-2xl ring-1 ring-indigo-500/20 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 -mr-8 -mt-8 bg-indigo-500/10 rounded-full blur-3xl" />
                
                <CardHeader className="relative flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-200">
                        <HandCoins className="h-4 w-4 text-indigo-400" />
                        미정산 입금 매칭
                        <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300 border-none ml-1">
                            {items.length}건
                        </Badge>
                    </CardTitle>
                </CardHeader>

                <CardContent className="relative space-y-3 pt-2">
                    <div className="flex items-start gap-2 mb-2 p-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                        <AlertCircle className="h-3 w-3 text-indigo-400 mt-0.5" />
                        <p className="text-[10px] text-indigo-300/80 leading-tight">
                            통장에 입금된 내역을 각 프로젝트와 연결하여 정산 상태를 업데이트하세요.
                        </p>
                    </div>

                    <div className="space-y-2">
                        {items.slice(0, 3).map((item) => (
                            <div 
                                key={item.id} 
                                className="group flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-indigo-500/30 cursor-pointer"
                                onClick={() => setSelectedItem(item)}
                            >
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-indigo-300 transition-colors">
                                        {item.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-500 font-medium">
                                        <span>{new Date(item.date).toLocaleDateString()}</span>
                                        {item.client_name && (
                                            <>
                                                <span className="w-0.5 h-0.5 rounded-full bg-slate-700" />
                                                <span className="truncate">{item.client_name}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right ml-4">
                                    <p className="text-xs font-black text-white group-hover:text-indigo-400 transition-colors">
                                        ₩{item.amount.toLocaleString()}
                                    </p>
                                    <div className="flex items-center justify-end gap-1 mt-0.5 text-[9px] text-indigo-400 font-bold uppercase tracking-wider">
                                        <LinkIcon className="h-2 w-2" /> 매칭하기
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {items.length > 3 && (
                        <p className="text-center text-[9px] text-slate-500 font-medium pt-1">
                            외 {items.length - 3}건의 미정산 내역이 더 있습니다.
                        </p>
                    )}
                </CardContent>
            </Card>

            {selectedItem && (
                <MatchIncomeDialog
                    isOpen={!!selectedItem}
                    onClose={() => {
                        setSelectedItem(null)
                        fetchItems() // Refresh after closing
                    }}
                    incomeId={selectedItem.id}
                    incomeType={selectedItem.type}
                    amount={selectedItem.amount}
                    title={selectedItem.title}
                />
            )}
        </>
    )
}
