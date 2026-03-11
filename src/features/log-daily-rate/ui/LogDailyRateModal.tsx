"use client"

import { useState, useEffect } from 'react';
import { Plus, Trash2, UserPlus, Receipt, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { createDailyLog } from '@/entities/daily-rate/api/create-daily-log';
import { updateDailyLog } from '@/entities/daily-rate/api/update-daily-log';
import { ClientSelect } from '@/entities/client/ui/ClientSelect';
import { CREW_ROLES, EXPENSE_CATEGORIES } from '@/shared/constants/business';
import { getCrewProfiles } from '@/entities/crew/api/crew-api';
import type { CrewPayment, SiteExpense, DailyRateLog } from '@/entities/daily-rate/model/types';
import type { CrewProfile } from '@/entities/crew/model/types';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';

interface LogDailyRateModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: DailyRateLog;
}

export function LogDailyRateModal({ open, onClose, onSuccess, initialData }: LogDailyRateModalProps) {
    const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
    const [clientId, setClientId] = useState('');
    const [siteName, setSiteName] = useState('');
    const [amountGross, setAmountGross] = useState('');

    const [showCrew, setShowCrew] = useState(false);
    const [crew, setCrew] = useState<Omit<CrewPayment, 'id' | 'daily_rate_log_id' | 'amount_net'>[]>([]);
    const [crewProfiles, setCrewProfiles] = useState<CrewProfile[]>([]);
    const [crewLoading, setCrewLoading] = useState(false);

    const [showExpenses, setShowExpenses] = useState(false);
    const [expenses, setExpenses] = useState<Omit<SiteExpense, 'id' | 'daily_rate_log_id'>[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load crew profiles when modal opens
    useEffect(() => {
        if (open) {
            setCrewLoading(true);
            getCrewProfiles()
                .then(setCrewProfiles)
                .catch(err => {
                    console.error('Failed to load crew profiles:', err);
                    toast.error('크루 목록 로드 실패');
                })
                .finally(() => setCrewLoading(false));
        }
    }, [open]);

    // Populate data when in edit mode
    useEffect(() => {
        if (initialData && open) {
            setWorkDate(initialData.work_date);
            setClientId(initialData.client_id || '');
            setSiteName(initialData.site_name);
            setAmountGross(initialData.amount_gross.toString());
            setCrew(initialData.crew_payments?.map(c => ({
                crew_name: c.crew_name,
                role: c.role,
                amount_gross: c.amount_gross,
                withholding_rate: c.withholding_rate,
                paid: c.paid
            })) || []);
            setExpenses(initialData.site_expenses?.map(e => ({
                category: e.category,
                amount: e.amount,
                memo: e.memo,
                included_in_invoice: e.included_in_invoice
            })) || []);
            setShowCrew(!!initialData.crew_payments?.length);
            setShowExpenses(!!initialData.site_expenses?.length);
        } else if (open) {
            // Reset for new entry
            setWorkDate(new Date().toISOString().split('T')[0]);
            setClientId('');
            setSiteName('');
            setAmountGross('');
            setCrew([]);
            setExpenses([]);
            setShowCrew(false);
            setShowExpenses(false);
        }
    }, [initialData, open]);

    const netPreview = Number(amountGross) || 0;

    const totalBilling = netPreview +
        crew.reduce((acc, c) => acc + (Number(c.amount_gross) || 0), 0) +
        expenses.reduce((acc, e) => acc + (e.included_in_invoice ? (Number(e.amount) || 0) : 0), 0);

    async function handleSubmit() {
        if (!siteName || !amountGross) return;
        setIsSubmitting(true);
        try {
            const logData = {
                work_date: workDate,
                client_id: clientId || undefined,
                site_name: siteName,
                amount_gross: Number(amountGross),
                withholding_rate: 0,
                payment_status: initialData?.payment_status || 'pending',
            };

            if (initialData?.id) {
                await updateDailyLog({
                    id: initialData.id,
                    log: logData,
                    crew: crew.map(c => ({ ...c, amount_gross: Number(c.amount_gross) })),
                    expenses: expenses.map(e => ({ ...e, amount: Number(e.amount) })),
                });
                toast.success('기록이 수정되었습니다.');
            } else {
                await createDailyLog({
                    log: logData,
                    crew: crew.map(c => ({ ...c, amount_gross: Number(c.amount_gross) })),
                    expenses: expenses.map(e => ({ ...e, amount: Number(e.amount) })),
                });
                toast.success('새로운 기록이 등록되었습니다.');
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('기록 저장 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-slate-900/90 rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-white">
                        <Plus className="h-5 w-5 text-blue-500" />
                        {initialData ? '일당 기록 수정' : '현장 일당 기록 추가'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="workDate" className="text-slate-300">날짜</Label>
                        <Input id="workDate" type="date" value={workDate} onChange={e => setWorkDate(e.target.value)} className="bg-slate-800/50 text-white" />
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-slate-300">거래처</Label>
                        <ClientSelect value={clientId} onValueChange={setClientId} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="siteName" className="text-slate-300">현장명 / 작품명</Label>
                        <Input id="siteName" placeholder="예: 현대차 CF, 드라마 OO" value={siteName} onChange={e => setSiteName(e.target.value)} className="bg-slate-800/50 text-white" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="amountGross" className="text-slate-300">일당 (세전)</Label>
                        <div className="relative">
                            <Input id="amountGross" type="number" placeholder="0" value={amountGross} onChange={e => setAmountGross(e.target.value)} className="bg-slate-800/50 text-white pr-10 font-bold" />
                            <span className="absolute right-3 top-2.5 text-sm text-slate-500">원</span>
                        </div>
                        {netPreview > 0 && (
                            <p className="text-xs text-blue-400 font-medium">
                                ✨ 본인 실수령액: {netPreview.toLocaleString()}원 (계산서 발행)
                            </p>
                        )}
                    </div>

                    {/* Crew Section */}
                    <div className="border-t pt-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-between px-2 h-8 hover:bg-white/5 text-slate-300"
                            onClick={() => setShowCrew(!showCrew)}
                        >
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <UserPlus className="h-4 w-4" />
                                크루 인건비 {crew.length > 0 && `(${crew.length})`}
                            </div>
                            <span className="text-xs">{showCrew ? '접기' : '펼치기'}</span>
                        </Button>

                        {showCrew && (
                            <div className="mt-4 space-y-4 pl-3 border-l-2 border-blue-500/20">
                                {crew.map((c, i) => (
                                    <div key={i} className="relative grid grid-cols-12 gap-3 items-end bg-white/5 p-4 rounded-xl shadow-sm">
                                        <div className="col-span-12 sm:col-span-4 space-y-1.5">
                                            <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">이름</Label>
                                            <Select
                                                value={c.crew_name}
                                                onValueChange={crewName => {
                                                    const selectedCrew = crewProfiles.find(cp => cp.name === crewName);
                                                    const next = [...crew];
                                                    next[i].crew_name = crewName;
                                                    next[i].withholding_rate = selectedCrew?.withholding_rate || 0.033;
                                                    setCrew(next);
                                                }}
                                            >
                                                <SelectTrigger className="h-9 text-sm bg-slate-800/50 text-white">
                                                    <SelectValue placeholder={crewLoading ? "로딩 중..." : "크루 선택"} />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 text-white max-h-48">
                                                    {crewProfiles.map(profile => (
                                                        <SelectItem key={profile.id} value={profile.name}>
                                                            {profile.name} ({(profile.withholding_rate * 100).toFixed(1)}%)
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-6 sm:col-span-3 space-y-1.5">
                                            <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">역할</Label>
                                            <Select
                                                value={c.role}
                                                onValueChange={val => {
                                                    const next = [...crew];
                                                    next[i].role = val;
                                                    setCrew(next);
                                                }}
                                            >
                                                <SelectTrigger className="h-9 text-sm bg-slate-800/50 text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 text-white">
                                                    {CREW_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-5 sm:col-span-3 space-y-1.5">
                                            <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">세전 금액</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    className="h-9 text-sm pr-7 bg-slate-800/50 text-white font-bold"
                                                    placeholder="0"
                                                    value={c.amount_gross || ''}
                                                    onChange={e => {
                                                        const next = [...crew];
                                                        next[i].amount_gross = Number(e.target.value);
                                                        setCrew(next);
                                                    }}
                                                />
                                                <span className="absolute right-2.5 top-2 text-[10px] text-slate-500">원</span>
                                            </div>
                                        </div>

                                        <div className="col-span-5 sm:col-span-2 space-y-1.5">
                                            <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">실수령액</Label>
                                            <div className="h-9 bg-slate-800/50 rounded px-3 flex items-center justify-end text-sm font-bold text-green-400">
                                                {(c.amount_gross * (1 - c.withholding_rate)).toLocaleString()}원
                                            </div>
                                        </div>
                                        <div className="col-span-12 sm:col-span-1 flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10"
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
                                    className="w-full text-xs h-9 border-dashed bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                                    onClick={() => setCrew([...crew, { crew_name: '', role: '세컨', amount_gross: 0, withholding_rate: 0.033, paid: false }])}
                                >
                                    <Plus className="h-3.5 w-3.5 mr-2" /> 크루 추가
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Expense Section */}
                    <div className="border-t pt-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-between px-2 h-8 hover:bg-white/5 text-slate-300"
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
                                    <div key={i} className="relative grid grid-cols-12 gap-3 items-end bg-white/5 p-4 rounded-xl shadow-sm">
                                        <div className="col-span-6 sm:col-span-4 space-y-1.5">
                                            <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">항목</Label>
                                            <Select
                                                value={e.category}
                                                onValueChange={val => {
                                                    const next = [...expenses];
                                                    next[i].category = val;
                                                    setExpenses(next);
                                                }}
                                            >
                                                <SelectTrigger className="h-9 text-sm bg-slate-800/50 text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 text-white">
                                                    {EXPENSE_CATEGORIES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-6 sm:col-span-4 space-y-1.5">
                                            <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">금액</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    className="h-9 text-sm pr-7 bg-slate-800/50 text-white font-bold"
                                                    placeholder="0"
                                                    value={e.amount || ''}
                                                    onChange={val => {
                                                        const next = [...expenses];
                                                        next[i].amount = Number(val.target.value);
                                                        setExpenses(next);
                                                    }}
                                                />
                                                <span className="absolute right-2.5 top-2 text-[10px] text-slate-500">원</span>
                                            </div>
                                        </div>
                                        <div className="col-span-9 sm:col-span-3 pb-2 flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`inc-${i}`}
                                                className="w-4 h-4 rounded bg-slate-800 text-amber-600 focus:ring-amber-500/30"
                                                checked={e.included_in_invoice}
                                                onChange={v => {
                                                    const next = [...expenses];
                                                    next[i].included_in_invoice = v.target.checked;
                                                    setExpenses(next);
                                                }}
                                            />
                                            <Label htmlFor={`inc-${i}`} className="text-xs font-medium cursor-pointer text-slate-400">청구 포함</Label>
                                        </div>
                                        <div className="col-span-3 sm:col-span-1 flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10"
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
                                    className="w-full text-xs h-9 border-dashed bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                                    onClick={() => setExpenses([...expenses, { category: '주차비', amount: 0, included_in_invoice: true, memo: '' }])}
                                >
                                    <Plus className="h-3.5 w-3.5 mr-2" /> 진행비 추가
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Billing Summary */}
                    {(crew.length > 0 || expenses.length > 0) && (
                        <div className="bg-primary/20 text-blue-400 rounded-2xl p-5 border-blue-500/30">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest mb-2 text-blue-400/70">
                                <span>최종 거래처 청구 예정액</span>
                                <span className="bg-blue-500/10 px-2.5 py-1 rounded-full border-blue-500/20">세금계산서 발행 포함</span>
                            </div>
                            <div className="text-3xl font-black flex items-baseline gap-1.5 leading-none text-white">
                                {totalBilling.toLocaleString()}
                                <span className="text-lg font-medium opacity-60">KRW</span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="flex-1 text-slate-400 hover:text-white hover:bg-white/5">취소</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !siteName || !amountGross} className="flex-1 bg-primary hover:bg-blue-700 text-white font-bold">
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (initialData ? '수정 완료' : '기록 완료')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
