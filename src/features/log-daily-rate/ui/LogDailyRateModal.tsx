"use client"

import { useState } from 'react';
import { Plus, Trash2, UserPlus, Receipt } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { createDailyLog } from '@/entities/daily-rate/api/create-daily-log';
import { ClientSelect } from '@/entities/client/ui/ClientSelect';
import { CREW_ROLES, EXPENSE_CATEGORIES } from '@/shared/constants/business';
import type { CrewPayment, SiteExpense } from '@/entities/daily-rate/model/types';
import { cn } from '@/shared/lib/utils';

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function LogDailyRateModal({ open, onClose, onSuccess }: Props) {
    const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
    const [clientId, setClientId] = useState('');
    const [siteName, setSiteName] = useState('');
    const [amountGross, setAmountGross] = useState('');

    const [showCrew, setShowCrew] = useState(false);
    const [crew, setCrew] = useState<Omit<CrewPayment, 'id' | 'daily_rate_log_id' | 'amount_net'>[]>([]);

    const [showExpenses, setShowExpenses] = useState(false);
    const [expenses, setExpenses] = useState<Omit<SiteExpense, 'id' | 'daily_rate_log_id'>[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const netPreview = Number(amountGross) || 0;

    const totalBilling = netPreview +
        crew.reduce((acc, c) => acc + (Number(c.amount_gross) || 0), 0) +
        expenses.reduce((acc, e) => acc + (e.included_in_invoice ? (Number(e.amount) || 0) : 0), 0);

    async function handleSubmit() {
        if (!siteName || !amountGross) return;
        setIsSubmitting(true);
        try {
            await createDailyLog({
                log: {
                    work_date: workDate,
                    client_id: clientId || undefined,
                    site_name: siteName,
                    amount_gross: Number(amountGross),
                    withholding_rate: 0,
                    payment_status: 'pending',
                },
                crew: crew.map(c => ({ ...c, amount_gross: Number(c.amount_gross) })),
                expenses: expenses.map(e => ({ ...e, amount: Number(e.amount) })),
            });
            onSuccess();
            onClose();
            // Reset state
            setWorkDate(new Date().toISOString().split('T')[0]);
            setClientId('');
            setSiteName('');
            setAmountGross('');
            setCrew([]);
            setExpenses([]);
            setShowCrew(false);
            setShowExpenses(false);
        } catch (error) {
            console.error(error);
            alert('기록 저장 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5 text-blue-500" />
                        현장 일당 기록
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="workDate">날짜</Label>
                        <Input id="workDate" type="date" value={workDate} onChange={e => setWorkDate(e.target.value)} />
                    </div>

                    <div className="grid gap-2">
                        <Label>거래처</Label>
                        <ClientSelect value={clientId} onValueChange={setClientId} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="siteName">현장명 / 작품명</Label>
                        <Input id="siteName" placeholder="예: 현대차 CF, 드라마 OO" value={siteName} onChange={e => setSiteName(e.target.value)} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="amountGross">일당 (세전)</Label>
                        <div className="relative">
                            <Input id="amountGross" type="number" placeholder="0" value={amountGross} onChange={e => setAmountGross(e.target.value)} />
                            <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">원</span>
                        </div>
                        {netPreview > 0 && (
                            <p className="text-xs text-muted-foreground font-medium">
                                ✨ 본인 실수령액: {netPreview.toLocaleString()}원 (계산서 발행)
                            </p>
                        )}
                    </div>

                    {/* Crew Section */}
                    <div className="border-t pt-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-between px-2 h-8"
                            onClick={() => setShowCrew(!showCrew)}
                        >
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <UserPlus className="h-4 w-4" />
                                크루 인건비 {crew.length > 0 && `(${crew.length})`}
                            </div>
                            <span className="text-xs">{showCrew ? '접기' : '펼치기'}</span>
                        </Button>

                        {showCrew && (
                            <div className="mt-4 space-y-4 pl-3 border-l-2 border-primary/20">
                                {crew.map((c, i) => (
                                    <div key={i} className="relative grid grid-cols-12 gap-3 items-end bg-secondary/30 p-4 rounded-xl border border-border/50 shadow-sm transition-all hover:shadow-md">
                                        <div className="col-span-12 sm:col-span-4 space-y-1.5">
                                            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">이름</Label>
                                            <Input
                                                className="h-9 text-sm bg-background/50 border-muted group-hover:border-primary/30"
                                                placeholder="크루 이름"
                                                value={c.crew_name}
                                                onChange={e => {
                                                    const next = [...crew];
                                                    next[i].crew_name = e.target.value;
                                                    setCrew(next);
                                                }}
                                            />
                                        </div>
                                        <div className="col-span-6 sm:col-span-3 space-y-1.5">
                                            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">역할</Label>
                                            <Select
                                                value={c.role}
                                                onValueChange={val => {
                                                    const next = [...crew];
                                                    next[i].role = val;
                                                    setCrew(next);
                                                }}
                                            >
                                                <SelectTrigger className="h-9 text-sm bg-background/50 border-muted">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {CREW_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-6 sm:col-span-4 space-y-1.5">
                                            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">세전 금액</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    className="h-9 text-sm pr-7 bg-background/50 border-muted"
                                                    placeholder="0"
                                                    value={c.amount_gross || ''}
                                                    onChange={e => {
                                                        const next = [...crew];
                                                        next[i].amount_gross = Number(e.target.value);
                                                        setCrew(next);
                                                    }}
                                                />
                                                <span className="absolute right-2.5 top-2 text-[10px] text-muted-foreground">원</span>
                                            </div>
                                        </div>
                                        <div className="col-span-12 sm:col-span-1 flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                onClick={() => setCrew(crew.filter((_, idx) => idx !== i))}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs h-9 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                                    onClick={() => setCrew([...crew, { crew_name: '', role: '세컨', amount_gross: 0, withholding_rate: 3.3, paid: false }])}
                                >
                                    <Plus className="h-3.5 w-3.5 mr-2 group-hover:scale-110 transition-transform" /> 크루 추가
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Expense Section */}
                    <div className="border-t pt-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-between px-2 h-8"
                            onClick={() => setShowExpenses(!showExpenses)}
                        >
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <Receipt className="h-4 w-4" />
                                현장 진행비 {expenses.length > 0 && `(${expenses.length})`}
                            </div>
                            <span className="text-xs">{showExpenses ? '접기' : '펼치기'}</span>
                        </Button>

                        {showExpenses && (
                            <div className="mt-4 space-y-4 pl-3 border-l-2 border-amber-500/20">
                                {expenses.map((e, i) => (
                                    <div key={i} className="relative grid grid-cols-12 gap-3 items-end bg-secondary/30 p-4 rounded-xl border border-border/50 shadow-sm transition-all hover:shadow-md">
                                        <div className="col-span-6 sm:col-span-4 space-y-1.5">
                                            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">항목</Label>
                                            <Select
                                                value={e.category}
                                                onValueChange={val => {
                                                    const next = [...expenses];
                                                    next[i].category = val;
                                                    setExpenses(next);
                                                }}
                                            >
                                                <SelectTrigger className="h-9 text-sm bg-background/50 border-muted">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {EXPENSE_CATEGORIES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-6 sm:col-span-4 space-y-1.5">
                                            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">금액</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    className="h-9 text-sm pr-7 bg-background/50 border-muted"
                                                    placeholder="0"
                                                    value={e.amount || ''}
                                                    onChange={val => {
                                                        const next = [...expenses];
                                                        next[i].amount = Number(val.target.value);
                                                        setExpenses(next);
                                                    }}
                                                />
                                                <span className="absolute right-2.5 top-2 text-[10px] text-muted-foreground">원</span>
                                            </div>
                                        </div>
                                        <div className="col-span-9 sm:col-span-3 pb-2 flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`inc-${i}`}
                                                className="w-4 h-4 rounded border-muted bg-background/50 text-amber-600 focus:ring-amber-500/30"
                                                checked={e.included_in_invoice}
                                                onChange={v => {
                                                    const next = [...expenses];
                                                    next[i].included_in_invoice = v.target.checked;
                                                    setExpenses(next);
                                                }}
                                            />
                                            <Label htmlFor={`inc-${i}`} className="text-xs font-medium cursor-pointer text-muted-foreground">청구 포함</Label>
                                        </div>
                                        <div className="col-span-3 sm:col-span-1 flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                onClick={() => setExpenses(expenses.filter((_, idx) => idx !== i))}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs h-9 border-dashed border-muted-foreground/30 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group"
                                    onClick={() => setExpenses([...expenses, { category: '주차비', amount: 0, included_in_invoice: true }])}
                                >
                                    <Plus className="h-3.5 w-3.5 mr-2 group-hover:scale-110 transition-transform" /> 진행비(영수증) 추가
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Billing Summary */}
                    {(crew.length > 0 || expenses.length > 0) && (
                        <div className="bg-primary text-primary-foreground rounded-2xl p-5 shadow-xl border border-primary/20 backdrop-blur-sm">
                            <div className="flex justify-between items-center opacity-70 text-[10px] font-bold uppercase tracking-widest mb-2">
                                <span>최종 거래처 청구 예정액</span>
                                <span className="bg-primary-foreground/20 px-2.5 py-1 rounded-full border border-primary-foreground/10">Tax Invoice Included</span>
                            </div>
                            <div className="text-3xl font-black flex items-baseline gap-1.5 leading-none">
                                {totalBilling.toLocaleString()}
                                <span className="text-lg font-medium opacity-60">KRW</span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1">취소</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !siteName || !amountGross} className="flex-1 bg-blue-600 hover:bg-blue-700">
                        {isSubmitting ? '저장 중...' : '기록 완료'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
