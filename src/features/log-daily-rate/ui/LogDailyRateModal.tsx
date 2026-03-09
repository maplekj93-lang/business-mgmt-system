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
                            <div className="mt-3 space-y-3 pl-2 border-l-2 border-blue-100">
                                {crew.map((c, i) => (
                                    <div key={i} className="grid grid-cols-12 gap-2 items-end bg-slate-50 p-2 rounded-md">
                                        <div className="col-span-4 space-y-1">
                                            <Label className="text-[10px]">이름</Label>
                                            <Input
                                                className="h-8 text-xs"
                                                value={c.crew_name}
                                                onChange={e => {
                                                    const next = [...crew];
                                                    next[i].crew_name = e.target.value;
                                                    setCrew(next);
                                                }}
                                            />
                                        </div>
                                        <div className="col-span-3 space-y-1">
                                            <Label className="text-[10px]">역할</Label>
                                            <Select
                                                value={c.role}
                                                onValueChange={val => {
                                                    const next = [...crew];
                                                    next[i].role = val;
                                                    setCrew(next);
                                                }}
                                            >
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {CREW_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-4 space-y-1">
                                            <Label className="text-[10px]">세전금액</Label>
                                            <Input
                                                type="number"
                                                className="h-8 text-xs"
                                                value={c.amount_gross}
                                                onChange={e => {
                                                    const next = [...crew];
                                                    next[i].amount_gross = Number(e.target.value);
                                                    setCrew(next);
                                                }}
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500"
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
                                    className="w-full text-xs h-7 border-dashed"
                                    onClick={() => setCrew([...crew, { crew_name: '', role: '세컨', amount_gross: 0, withholding_rate: 3.3, paid: false }])}
                                >
                                    <Plus className="h-3 w-3 mr-1" /> 크루 추가
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
                            <div className="mt-3 space-y-3 pl-2 border-l-2 border-orange-100">
                                {expenses.map((e, i) => (
                                    <div key={i} className="grid grid-cols-12 gap-2 items-end bg-orange-50/50 p-2 rounded-md">
                                        <div className="col-span-4 space-y-1">
                                            <Label className="text-[10px]">항목</Label>
                                            <Select
                                                value={e.category}
                                                onValueChange={val => {
                                                    const next = [...expenses];
                                                    next[i].category = val;
                                                    setExpenses(next);
                                                }}
                                            >
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {EXPENSE_CATEGORIES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-4 space-y-1">
                                            <Label className="text-[10px]">금액</Label>
                                            <Input
                                                type="number"
                                                className="h-8 text-xs"
                                                value={e.amount}
                                                onChange={val => {
                                                    const next = [...expenses];
                                                    next[i].amount = Number(val.target.value);
                                                    setExpenses(next);
                                                }}
                                            />
                                        </div>
                                        <div className="col-span-3 pb-1 flex items-center gap-1">
                                            <input
                                                type="checkbox"
                                                id={`inc-${i}`}
                                                checked={e.included_in_invoice}
                                                onChange={v => {
                                                    const next = [...expenses];
                                                    next[i].included_in_invoice = v.target.checked;
                                                    setExpenses(next);
                                                }}
                                            />
                                            <Label htmlFor={`inc-${i}`} className="text-[10px] cursor-pointer">청구포함</Label>
                                        </div>
                                        <div className="col-span-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500"
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
                                    className="w-full text-xs h-7 border-dashed"
                                    onClick={() => setExpenses([...expenses, { category: '주차비', amount: 0, included_in_invoice: true }])}
                                >
                                    <Plus className="h-3 w-3 mr-1" /> 진행비(영수증) 추가
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Billing Summary */}
                    {(crew.length > 0 || expenses.length > 0) && (
                        <div className="bg-blue-600 text-white rounded-xl p-4 shadow-lg">
                            <div className="flex justify-between items-center opacity-80 text-xs mb-1">
                                <span>거래처 청구 예정 총액</span>
                                <span className="bg-white/20 px-2 py-0.5 rounded">계산서 합산용</span>
                            </div>
                            <div className="text-2xl font-bold flex items-baseline gap-1">
                                {totalBilling.toLocaleString()}
                                <span className="text-sm font-normal">원</span>
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
