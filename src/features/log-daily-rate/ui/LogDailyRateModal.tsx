"use client"

import { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { createDailyLog } from '@/entities/daily-rate/api/create-daily-log';
import { updateDailyLog } from '@/entities/daily-rate/api/update-daily-log';
import { ClientSelect } from '@/entities/client/ui/ClientSelect';
import { getCrewProfiles } from '@/entities/crew/api/crew-api';
import type { CrewPayment, SiteExpense, DailyRateLog, VatType } from '@/entities/daily-rate/model/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import type { CrewProfile } from '@/entities/crew/model/types';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';

// Sub-sections
import { CrewSection } from './sections/CrewSection';
import { ExpenseSection } from './sections/ExpenseSection';

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
    const [vatType, setVatType] = useState<VatType>('exclude'); // 사용자 요청: 별도 기본

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
                vat_type: c.vat_type || 'none',
                withholding_rate: c.withholding_rate,
                paid: c.paid
            })) || []);
            setVatType(initialData.vat_type || 'none');
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
            setVatType('exclude'); // 신규 등록 시 별도 기본
            setCrew([]);
            setExpenses([]);
            setShowCrew(false);
            setShowExpenses(false);
        }
    }, [initialData, open]);

    const applyVat = (amount: number, type?: VatType) => {
        if (type === 'exclude') return amount * 1.1;
        return amount;
    };

    const myBase = applyVat(Number(amountGross) || 0, vatType);

    const totalBilling = myBase +
        crew.reduce((acc, c) => acc + applyVat(Number(c.amount_gross) || 0, c.vat_type), 0) +
        expenses.reduce((acc, e) => acc + (e.included_in_invoice ? (Number(e.amount) || 0) : 0), 0);

    async function handleSubmit() {
        if (!siteName || !amountGross) return;
        setIsSubmitting(true);
        try {
            const input = {
                work_date: workDate,
                client_id: clientId || undefined,
                site_name: siteName,
                amount_gross: Number(amountGross),
                vat_type: vatType,
                withholding_rate: 0,
                payment_status: initialData?.payment_status || 'pending',
                crew_payments: crew.map(c => ({ 
                    ...c, 
                    amount_gross: Number(c.amount_gross),
                    vat_type: c.vat_type || 'none'
                })),
                site_expenses: expenses.map(e => ({ ...e, amount: Number(e.amount) })),
            };

            let result;
            if (initialData?.id) {
                result = await updateDailyLog(initialData.id, input);
            } else {
                result = await createDailyLog(input);
            }

            if (result.success) {
                toast.success(initialData ? '기록이 수정되었습니다.' : '새로운 기록이 등록되었습니다.');
                onSuccess();
                onClose();
            } else {
                toast.error(result.error || '저장에 실패했습니다.');
            }
        } catch (error) {
            console.error(error);
            toast.error('기록 저장 중 예기치 않은 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-zinc-950/90 backdrop-blur-2xl border-white/5 rounded-[2rem] shadow-2xl custom-scrollbar">
                <DialogHeader className="border-b border-white/5 pb-4">
                    <DialogTitle className="flex items-center gap-2 text-white text-xl font-black tracking-tight">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Plus className="h-5 w-5 text-primary" />
                        </div>
                        {initialData ? '일당 기록 수정' : '현장 일당 기록 추가'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="workDate" className="text-slate-400 font-medium">날짜</Label>
                            <Input 
                                id="workDate" 
                                type="date" 
                                value={workDate} 
                                onChange={e => setWorkDate(e.target.value)} 
                                className="bg-slate-900/50 border-white/10 text-white focus:ring-primary/50" 
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-slate-400 font-medium">거래처</Label>
                            <ClientSelect value={clientId} onValueChange={setClientId} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="siteName" className="text-slate-400 font-medium">현장명 / 작품명</Label>
                            <Input 
                                id="siteName" 
                                placeholder="예: 현대차 CF, 드라마 OO" 
                                value={siteName} 
                                onChange={e => setSiteName(e.target.value)} 
                                className="bg-slate-900/50 border-white/10 text-white focus:ring-primary/50" 
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="amountGross" className="text-slate-400 font-medium">본인 일당 (세전)</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input 
                                        id="amountGross" 
                                        type="number" 
                                        placeholder="0" 
                                        value={amountGross} 
                                        onChange={e => setAmountGross(e.target.value)} 
                                        className="bg-slate-900/50 border-white/10 text-white pr-10 font-bold text-lg" 
                                    />
                                    <span className="absolute right-3 top-3 text-sm text-slate-500">원</span>
                                </div>
                                <Select value={vatType} onValueChange={(val) => setVatType(val as VatType)}>
                                    <SelectTrigger className="w-[100px] bg-slate-900/50 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                                        <SelectItem value="none">부가세 無</SelectItem>
                                        <SelectItem value="exclude">별도 (+10%)</SelectItem>
                                        <SelectItem value="include">포함</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <CrewSection 
                        crew={crew}
                        onChange={setCrew}
                        crewProfiles={crewProfiles}
                        crewLoading={crewLoading}
                        showCrew={showCrew}
                        onToggle={() => setShowCrew(!showCrew)}
                    />

                    <ExpenseSection 
                        expenses={expenses}
                        onChange={setExpenses}
                        showExpenses={showExpenses}
                        onToggle={() => setShowExpenses(!showExpenses)}
                    />

                    {/* Billing Summary */}
                    {(crew.length > 0 || expenses.length > 0 || Number(amountGross) > 0) && (
                        <div className="glass-panel rounded-2xl p-6 border-primary/20 bg-primary/5">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest mb-3 text-primary/70">
                                <span>최종 거래처 청구 예정액</span>
                                <span className="bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">세금계산서 발행 합산</span>
                            </div>
                            <div className="text-3xl font-black flex items-baseline gap-2 leading-none text-white">
                                {totalBilling.toLocaleString()}
                                <span className="text-lg font-medium opacity-40">KRW</span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex gap-2 border-t border-white/5 pt-6">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="flex-1 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl h-12">취소</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !siteName || !amountGross} className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-12 tactile-button">
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (initialData ? '수정 완료' : '기록 완료')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
