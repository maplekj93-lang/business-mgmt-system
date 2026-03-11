'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronRight, Trash2, Users, Receipt, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { BankSyncVerifyModal } from '@/features/verify-crew-payment/ui/BankSyncVerifyModal'
import { getDailyRateLogs } from '@/entities/daily-rate/api/get-daily-logs'
import { deleteDailyLog } from '@/entities/daily-rate/api/delete-daily-log'
import { updatePaymentStatus } from '@/entities/daily-rate/api/update-payment-status'
import { calcInvoiceTotal, type DailyRateLog } from '@/entities/daily-rate/model/types'
import { cn } from '@/shared/lib/utils'

interface Props {
    /** 외부에서 강제 리로드 트리거 (key 변경 없이 데이터만 재조회) */
    refreshKey?: number
    onRowClick?: (log: DailyRateLog) => void
}

function getYearMonth(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatYearMonth(ym: string) {
    const [y, m] = ym.split('-')
    return `${y}년 ${Number(m)}월`
}

function prevMonth(ym: string) {
    const [y, m] = ym.split('-').map(Number)
    return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}

function nextMonth(ym: string) {
    const [y, m] = ym.split('-').map(Number)
    return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}

export function DailyRateTable({ refreshKey, onRowClick }: Props) {
    const [yearMonth, setYearMonth] = useState(() => getYearMonth(new Date()))
    const [logs, setLogs] = useState<DailyRateLog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [togglingId, setTogglingId] = useState<string | null>(null)

    const load = useCallback(async () => {
        setIsLoading(true)
        try {
            const data = await getDailyRateLogs(yearMonth)
            setLogs(data)
        } finally {
            setIsLoading(false)
        }
    }, [yearMonth])

    useEffect(() => { load() }, [load, refreshKey])

    function toggleExpand(id: string) {
        setExpandedIds(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    async function handleDelete(log: DailyRateLog) {
        const label = `${log.work_date} ${log.site_name}`
        if (!confirm(`"${label}" 기록을 삭제할까요?\n크루/진행비 내역도 함께 삭제됩니다.`)) return
        setDeletingId(log.id)
        try {
            await deleteDailyLog(log.id)
            setLogs(prev => prev.filter(l => l.id !== log.id))
        } catch {
            alert('삭제 중 오류가 발생했습니다.')
        } finally {
            setDeletingId(null)
        }
    }

    async function handleToggleStatus(log: DailyRateLog) {
        const next = log.payment_status === 'pending' ? 'paid' : 'pending'
        setTogglingId(log.id)
        try {
            await updatePaymentStatus(log.id, next)
            setLogs(prev => prev.map(l => l.id === log.id ? { ...l, payment_status: next } : l))
        } catch {
            alert('상태 변경 중 오류가 발생했습니다.')
        } finally {
            setTogglingId(null)
        }
    }

    // 월별 합계
    const totalGross = logs.reduce((s, l) => s + l.amount_gross, 0)
    const totalCrew = logs.reduce((s, l) =>
        s + (l.crew_payments?.reduce((cs, c) => cs + c.amount_gross, 0) ?? 0), 0)
    const pendingCount = logs.filter(l => l.payment_status === 'pending').length

    return (
        <div className="space-y-4">
            {/* 월 네비게이터 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setYearMonth(prevMonth(yearMonth))}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-semibold w-24 text-center">{formatYearMonth(yearMonth)}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setYearMonth(nextMonth(yearMonth))}
                        disabled={yearMonth >= getYearMonth(new Date())}
                    >
                        <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                </div>

                {/* 우측 상단 컨트롤 패널 */}
                <div className="flex items-center gap-4">
                    <BankSyncVerifyModal />
                    {/* 월 요약 */}
                    {!isLoading && logs.length > 0 && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground bg-white/5 px-4 py-2 rounded-full border border-white/10 shadow-sm">
                            <span className="font-medium">총 {logs.length}건</span>
                            <span className="font-medium">내 일당 <strong className="text-foreground ml-1">₩{totalGross.toLocaleString()}</strong></span>
                            {totalCrew > 0 && <span className="font-medium">크루 <strong className="text-foreground ml-1">₩{totalCrew.toLocaleString()}</strong></span>}
                            {pendingCount > 0 && (
                                <Badge variant="outline" className="text-orange-500 border-orange-500/30 bg-orange-500/10 ml-2">{pendingCount}건 미수금</Badge>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 테이블 */}
            {isLoading ? (
                <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-14 bg-muted/40 rounded-lg animate-pulse" />
                    ))}
                </div>
            ) : logs.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground text-sm border-2 border-dashed rounded-xl">
                    {formatYearMonth(yearMonth)} 기록이 없습니다.
                </div>
            ) : (
                <div className="rounded-xl overflow-hidden bg-background/50">
                    {/* 헤더 */}
                    <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-4 px-4 py-2 bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b">
                        <div className="w-4" />
                        <div>날짜 / 현장</div>
                        <div className="text-right w-24">일당 (세전)</div>
                        <div className="text-right w-24">청구 총액</div>
                        <div className="text-center w-20">입금 상태</div>
                        <div className="w-8" />
                    </div>

                    {/* 행 */}
                    <div className="divide-y divide-white/5">
                        {logs.map(log => {
                            const isExpanded = expandedIds.has(log.id)
                            const hasSub = (log.crew_payments?.length ?? 0) > 0 || (log.site_expenses?.length ?? 0) > 0
                            const invoiceTotal = calcInvoiceTotal(log)

                            return (
                                <div key={log.id}>
                                    {/* 메인 행 */}
                                    <div className={cn(
                                        "grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-4 px-4 py-3 items-center hover:bg-white/5 transition-all group",
                                        isExpanded && "bg-blue-500/5"
                                    )}>
                                        {/* 확장 토글 */}
                                        <button
                                            className={cn("w-4 text-slate-500 hover:text-white transition-colors", !hasSub && "invisible")}
                                            onClick={() => toggleExpand(log.id)}
                                        >
                                            {isExpanded
                                                ? <ChevronDown className="h-4 w-4" />
                                                : <ChevronRight className="h-4 w-4" />}
                                        </button>

                                        {/* 날짜 / 현장명 클릭 시 수정 모달 오픈 */}
                                        <div
                                            className="min-w-0 cursor-pointer group-hover:translate-x-1 transition-transform"
                                            onClick={() => onRowClick?.(log)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold truncate text-slate-200">{log.site_name}</span>
                                                {(log.crew_payments?.length ?? 0) > 0 && (
                                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded border-blue-400/20">
                                                        <Users className="h-2.5 w-2.5" />{log.crew_payments!.length}
                                                    </span>
                                                )}
                                                {(log.site_expenses?.length ?? 0) > 0 && (
                                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border-amber-400/20">
                                                        <Receipt className="h-2.5 w-2.5" />{log.site_expenses!.length}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1.5 slice">
                                                <span className="text-slate-400">{log.work_date}</span>
                                                {log.client?.name && (
                                                    <>
                                                        <span className="h-1 w-1 rounded-full bg-slate-700" />
                                                        <span className="text-slate-500">{log.client.name}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* 내 일당 */}
                                        <div className="text-right text-sm font-black w-24 text-slate-200">
                                            ₩{log.amount_gross.toLocaleString()}
                                        </div>

                                        {/* 청구 총액 */}
                                        <div className="text-right w-24">
                                            {invoiceTotal !== log.amount_gross ? (
                                                <span className="text-sm text-blue-400 font-bold">₩{invoiceTotal.toLocaleString()}</span>
                                            ) : (
                                                <span className="text-xs text-slate-600 font-bold">-</span>
                                            )}
                                        </div>

                                        {/* 결제 상태 토글 */}
                                        <div className="flex justify-center w-20">
                                            <button
                                                onClick={() => handleToggleStatus(log)}
                                                disabled={togglingId === log.id}
                                                className="focus:outline-none"
                                            >
                                                <Badge className={cn(
                                                    "cursor-pointer text-[10px] font-black px-2.5 py-0.5 transition-all border-none rounded-full",
                                                    log.payment_status === 'paid'
                                                        ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                                        : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                                                )}>
                                                    {togglingId === log.id ? '...' : log.payment_status === 'paid' ? '입금완료' : '미수금'}
                                                </Badge>
                                            </button>
                                        </div>

                                        {/* 삭제 */}
                                        <div className="w-8 flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                                disabled={deletingId === log.id}
                                                onClick={() => handleDelete(log)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* 확장 상세 (크루 / 진행비) */}
                                    {isExpanded && hasSub && (
                                        <div className="px-8 pb-3 pt-1 bg-white/5 space-y-3 border-t">
                                            {/* 크루 */}
                                            {(log.crew_payments?.length ?? 0) > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">크루 인건비</p>
                                                    <div className="space-y-1">
                                                        {log.crew_payments!.map(c => (
                                                            <div key={c.id} className="flex justify-between text-xs">
                                                                <span className="text-slate-400 font-medium">
                                                                    {c.crew_name}
                                                                    {c.role && <span className="ml-1.5 text-[9px] bg-slate-800 text-slate-500 px-1.5 rounded font-black uppercase tracking-widest">{c.role}</span>}
                                                                    {(c as any).bank_verified ? (
                                                                        <span className="ml-2 text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 rounded font-black tracking-wide">✓ 송금확인</span>
                                                                    ) : c.paid ? (
                                                                        <span className="ml-2 text-[9px] bg-slate-500/10 text-slate-400 border border-slate-500/20 px-1.5 rounded font-black tracking-wide">지급완료</span>
                                                                    ) : null}
                                                                </span>
                                                                <span className="font-bold text-slate-300">
                                                                    ₩{c.amount_gross.toLocaleString()}
                                                                    <span className="text-[10px] text-slate-500 ml-1.5 font-medium">(실 {c.amount_net.toLocaleString()})</span>
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 진행비 */}
                                            {(log.site_expenses?.length ?? 0) > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">현장 진행비</p>
                                                    <div className="space-y-1">
                                                        {log.site_expenses!.map(e => (
                                                            <div key={e.id} className="flex justify-between text-xs">
                                                                <span className="text-slate-400 font-medium">
                                                                    {e.category}
                                                                    {e.included_in_invoice && (
                                                                        <span className="ml-1.5 text-[9px] bg-blue-500/10 text-blue-400 px-1.5 rounded font-black">청구포함</span>
                                                                    )}
                                                                </span>
                                                                <span className="font-bold text-slate-300">₩{e.amount.toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
