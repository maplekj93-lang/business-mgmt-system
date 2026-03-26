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
import { Checkbox } from '@/shared/ui/checkbox'
import { Badge } from '@/shared/ui/badge'
import { Loader2, Search, Link as LinkIcon, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/shared/api/supabase/client'
import { matchIncomeActionV2 } from '../api/match-income-v2'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/utils'
import { getConfidenceLevel, CONFIDENCE_CONFIG, formatMatchReason } from '../lib/matching-logic'

interface MatchIncomeDialogProps {
    isOpen: boolean
    onClose: () => void
    incomeId: string
    amount: number
    title: string
    incomeType?: 'project_income' | 'daily_rate_log'
}

export function MatchIncomeDialog({ 
    isOpen, 
    onClose, 
    incomeId, 
    amount: targetAmount, 
    title,
    incomeType = 'project_income'
}: MatchIncomeDialogProps) {
    const [search, setSearch] = useState('')
    const [candidates, setCandidates] = useState<any[]>([]) // Using any for RPC row temporarily until shared types sync
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [createRule, setCreateRule] = useState(true)
    const supabase = createClient()

    const selectedTotal = candidates
        .filter(c => selectedIds.includes(c.transaction_id))
        .reduce((sum, c) => sum + (c.transaction_amount as number), 0)

    const remainingAmount = targetAmount - selectedTotal

    const fetchCandidates = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await (supabase.rpc as any)('get_income_matching_candidates_v3', {
                p_income_id: incomeId,
                p_income_type: incomeType,
                p_target_amount: targetAmount,
                p_search_query: search || null,
                p_choice_required: true // Always require choice for now
            })
            if (error) throw error
            setCandidates((data as any[]) || [])
        } catch (e) {
            console.error('Fetch candidates error:', e)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen) fetchCandidates()
    }, [isOpen, search])

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleConfirmMatch = async () => {
        if (selectedIds.length === 0) {
            toast.error('매칭할 거래를 선택해주세요.')
            return
        }

        setIsSubmitting(true)
        try {
            // Simplify: All selected transactions are fully allocated for now
            const res = await matchIncomeActionV2({
                incomeId,
                incomeType,
                transactionIds: selectedIds,
                amountsAllocated: selectedIds.map(id => 
                    candidates.find(c => c.transaction_id === id)?.transaction_amount || 0
                ),
                createRule,
                ruleSenderName: candidates.find(c => c.transaction_id === selectedIds[0])?.transaction_description,
                ruleKeyword: title
            })

            if (res.success) {
                toast.success('매칭이 완료되었습니다.')
                onClose()
            } else {
                toast.error(res.message)
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <LinkIcon className="h-5 w-5 text-primary" />
                        수입 정산 매칭
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* 매칭 요약 정보 */}
                    <div className="bg-muted/50 p-4 rounded-xl border space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">대상 항목</p>
                                <h4 className="font-semibold text-sm line-clamp-1">{title}</h4>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">정산 목표액</p>
                                <p className="font-bold text-lg">₩{targetAmount.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-dashed flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">선택된 합계: <b className="text-foreground">₩{selectedTotal.toLocaleString()}</b></span>
                            {remainingAmount === 0 ? (
                                <span className="text-green-600 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> 금액 일치
                                </span>
                            ) : (
                                <span className={cn("font-medium", remainingAmount > 0 ? "text-amber-600" : "text-red-600")}>
                                    잔액: ₩{remainingAmount.toLocaleString()}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* 검색 바 */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="입금자명 또는 내용 검색..."
                            className="pl-9 h-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* 후보 리스트 */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-2">
                                <Loader2 className="animate-spin text-primary h-6 w-6" />
                                <p className="text-xs text-muted-foreground">최적의 후보를 찾는 중...</p>
                            </div>
                        ) : candidates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <AlertCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
                                <p className="text-sm text-muted-foreground">매칭 가능한 수입 내역이 없습니다.</p>
                                <p className="text-[10px] text-muted-foreground mt-1">검색어를 입력하여 수동으로 찾아보세요.</p>
                            </div>
                        ) : (
                            candidates.map(candidate => {
                                const confidence = getConfidenceLevel(candidate.confidence_score)
                                const config = CONFIDENCE_CONFIG[confidence]
                                const isSelected = selectedIds.includes(candidate.transaction_id)

                                return (
                                    <div
                                        key={candidate.transaction_id}
                                        className={cn(
                                            "group relative flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                                            isSelected ? "border-primary bg-primary/5 shadow-sm" : "hover:border-primary/50 hover:bg-muted/30"
                                        )}
                                        onClick={() => toggleSelect(candidate.transaction_id)}
                                    >
                                        <div className="flex-shrink-0">
                                            <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(candidate.transaction_id)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-[10px] text-muted-foreground">{candidate.transaction_date}</span>
                                                <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0 h-5 border-none", config.bgColor, config.color)}>
                                                    {config.label}
                                                </Badge>
                                            </div>
                                            <p className="text-sm font-semibold truncate leading-tight group-hover:text-primary transition-colors">
                                                {candidate.transaction_description}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground mt-1 italic">
                                                {formatMatchReason(candidate.match_reason)}
                                            </p>
                                        </div>
                                        <div className="text-right ml-2">
                                            <p className={cn("font-bold text-sm", isSelected ? "text-primary" : "")}>
                                                ₩{candidate.transaction_amount.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {/* 자동 학습 옵션 */}
                    {selectedIds.length > 0 && (
                        <div className="flex items-center space-x-2 pt-2 px-1">
                            <Checkbox 
                                id="create-rule" 
                                checked={createRule} 
                                onCheckedChange={(checked) => setCreateRule(!!checked)} 
                            />
                            <label htmlFor="create-rule" className="text-[11px] font-medium leading-none cursor-pointer text-muted-foreground">
                                이 입금자명을 기억하고 다음에 자동으로 매칭 추천하기
                            </label>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting} className="text-muted-foreground">취소</Button>
                    <Button 
                        size="sm"
                        onClick={handleConfirmMatch} 
                        disabled={isSubmitting || selectedIds.length === 0}
                        className="px-6 shadow-md"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                        {selectedIds.length}건 매칭 확정
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
