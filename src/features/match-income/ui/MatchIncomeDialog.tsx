'use client'

import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Loader2, Search, Link as LinkIcon } from 'lucide-react'
import { createClient } from '@/shared/api/supabase/client'
import { matchIncomeAction } from '../api/match-income'
import { toast } from 'sonner'

interface MatchIncomeDialogProps {
    isOpen: boolean
    onClose: () => void
    incomeId: string
    amount: number
    title: string
}

export function MatchIncomeDialog({ isOpen, onClose, incomeId, amount, title }: MatchIncomeDialogProps) {
    const [search, setSearch] = useState('')
    const [transactions, setTransactions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const supabase = createClient()

    const fetchTransactions = async () => {
        setIsLoading(true)
        try {
            // Search for transactions that match amount or description
            let query = supabase
                .from('transactions')
                .select('*')
                .order('date', { ascending: false })
                .limit(20)

            if (search) {
                query = query.ilike('description', `%${search}%`)
            } else {
                // If no search, prioritize matching amount
                query = query.eq('amount', amount)
            }

            const { data } = await query
            setTransactions(data || [])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen) fetchTransactions()
    }, [isOpen, search])

    const handleMatch = async (txId: string) => {
        setIsSubmitting(true)
        const res = await matchIncomeAction(incomeId, txId)
        setIsSubmitting(false)
        if (res.success) {
            toast.success('매칭되었습니다.')
            onClose()
        } else {
            toast.error('매칭 실패: ' + res.message)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <LinkIcon className="h-5 w-5 text-indigo-500" />
                        수입 매칭 (Match Transaction)
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                        <p className="text-xs text-indigo-600 font-medium">매칭 대상 항목</p>
                        <div className="flex justify-between items-center mt-1">
                            <span className="font-bold">{title}</span>
                            <span className="font-bold text-lg text-indigo-700">₩{amount.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="내용으로 검색..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {isLoading ? (
                            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                        ) : transactions.length === 0 ? (
                            <p className="text-center py-8 text-sm text-muted-foreground">일치하는 내역이 없습니다.</p>
                        ) : (
                            transactions.map(tx => (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between p-3 rounded-md border hover:border-indigo-500 cursor-pointer transition-colors"
                                    onClick={() => handleMatch(tx.id)}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">{tx.date}</span>
                                        <span className="text-sm font-medium">{tx.description}</span>
                                    </div>
                                    <span className="font-bold text-sm">₩{tx.amount.toLocaleString()}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>취소</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
