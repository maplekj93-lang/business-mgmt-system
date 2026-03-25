"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Check, Edit2, AlertCircle, Sparkles, ChevronRight, Loader2 } from 'lucide-react'
import { getPendingTransactions } from '@/entities/transaction/api/get-pending-transactions'
import { confirmTransaction } from '@/entities/transaction/api/confirm-transaction'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/utils'

export function ActionCenterWidget() {
    const [pendingItems, setPendingItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)

    const fetchPending = async () => {
        setLoading(true)
        const result = await getPendingTransactions()
        if (result.success && result.data) {
            setPendingItems(result.data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchPending()
    }, [])

    const handleConfirm = async (id: string, categoryId: number | null, suggestedStatus: string) => {
        setProcessingId(id)
        const result = await confirmTransaction(id, suggestedStatus || 'business_personal', categoryId)
        if (result.success) {
            setPendingItems(prev => prev.filter(item => item.id !== id))
            toast.success('거래가 확정되었습니다.')
        } else {
            toast.error('확정에 실패했습니다: ' + result.error)
        }
        setProcessingId(null)
    }

    if (loading) {
        return (
            <Card className="border-none bg-slate-900/40 backdrop-blur-xl">
                <CardContent className="flex h-[200px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </CardContent>
            </Card>
        )
    }

    if (pendingItems.length === 0) return null;

    return (
        <Card className="border-none bg-slate-900/40 backdrop-blur-xl shadow-2xl ring-1 ring-white/10 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
            
            <CardHeader className="relative flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-200">
                    <div className="rounded-lg bg-primary/20 p-1.5 ring-1 ring-primary/30">
                        <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    액션 센터
                    <Badge variant="secondary" className="bg-primary/20 text-primary border-none ml-1 animate-pulse">
                        {pendingItems.length}
                    </Badge>
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-[10px] h-7 text-slate-400 hover:text-white hover:bg-white/5">
                    모두 확인 <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
            </CardHeader>

            <CardContent className="relative space-y-3 pt-2">
                {pendingItems.slice(0, 3).map((item) => {
                    const aiSuggestion = item.metadata?.ai_suggestion_type;
                    const confidence = item.metadata?.ai_confidence || 0;
                    const amount = item.amount;
                    
                    return (
                        <div key={item.id} className="group/item relative rounded-xl bg-white/5 p-4 transition-all hover:bg-white/10 ring-1 ring-white/5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-white truncate max-w-[150px]">
                                            {item.normalized_name || item.description}
                                        </p>
                                        <Badge variant="outline" className="text-[9px] py-0 h-4 border-primary/30 text-primary/80 bg-primary/5">
                                            {aiSuggestion === 'transfer' ? '이체 의심' : 'AI 추천'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                                        <span>{item.date}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-700" />
                                        <span className={cn(
                                            amount < 0 ? "text-rose-400" : "text-emerald-400",
                                            "font-bold"
                                        )}>
                                            {amount.toLocaleString()}원
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 rounded-full hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors"
                                        disabled={processingId === item.id}
                                        onClick={() => handleConfirm(item.id, item.category_id, item.allocation_status)}
                                    >
                                        {processingId === item.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Check className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 rounded-full hover:bg-white/10 text-slate-500"
                                    >
                                        <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                            
                            {/* Confidence Indicator */}
                            {confidence > 0 && (
                                <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className={cn(
                                            "h-full transition-all duration-1000",
                                            confidence > 0.8 ? "bg-emerald-500" : "bg-amber-500"
                                        )}
                                        style={{ width: `${confidence * 100}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    )
                })}
                
                {pendingItems.length > 3 && (
                    <p className="text-center text-[10px] text-slate-500 font-medium pb-2">
                        외 {pendingItems.length - 3}건의 내역이 더 있습니다.
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
