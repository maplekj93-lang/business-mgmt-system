'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/shared/api/supabase/client';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Save, RefreshCw, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { fetchFxRates, FX_FALLBACK_RATES } from '@/features/ledger-import/lib/fx-rate';

interface FxRateRow {
    currency: string;
    label: string;
    flag: string;
}

const FX_CURRENCIES: FxRateRow[] = [
    { currency: 'USD', label: '미국 달러', flag: '🇺🇸' },
    { currency: 'EUR', label: '유로',     flag: '🇪🇺' },
    { currency: 'JPY', label: '일본 엔 (1엔)', flag: '🇯🇵' },
    { currency: 'GBP', label: '영국 파운드', flag: '🇬🇧' },
    { currency: 'CNY', label: '중국 위안', flag: '🇨🇳' },
];

export default function FxRatesSettingsPage() {
    const supabase = createClient();
    const [rates, setRates] = useState<Record<string, number>>(FX_FALLBACK_RATES);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [liveRates, setLiveRates] = useState<Record<string, number> | null>(null);

    useEffect(() => {
        loadSavedRates();
    }, []);

    const loadSavedRates = async () => {
        setLoading(true);
        const { data } = await (supabase as any)
            .from('app_settings')
            .select('value')
            .eq('key', 'fx_fallback_rates')
            .single();

        if (data?.value) {
            setRates(data.value as Record<string, number>);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await (supabase as any)
                .from('app_settings')
                .upsert({ key: 'fx_fallback_rates', value: rates }, { onConflict: 'key' });

            if (error) throw error;
            toast.success('환율 설정이 저장되었습니다.');
        } catch (err: any) {
            toast.error(`저장 실패: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleFetchLive = async () => {
        setFetching(true);
        try {
            // 캐시 무시하고 강제 API 호출
            const fx = await fetchFxRates();
            setLiveRates(fx.rates);
            if (fx.source === 'api') {
                toast.success(`실시간 환율 조회 성공 (USD: ${fx.rates.USD?.toLocaleString()}원)`);
            } else {
                toast.warning('API 연결 실패 — fallback 환율입니다.');
            }
        } catch {
            toast.error('환율 API 오류');
        } finally {
            setFetching(false);
        }
    };

    const applyLiveRates = () => {
        if (!liveRates) return;
        // 소수점 1자리로 반올림해서 적용
        const rounded = Object.fromEntries(
            Object.entries(liveRates).map(([k, v]) => [k, Math.round(v * 10) / 10])
        );
        setRates(prev => ({ ...prev, ...rounded }));
        setLiveRates(null);
        toast.info('실시간 환율 적용됨 — 저장 버튼을 눌러 확정하세요.');
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">로드 중...</div>;

    return (
        <div className="pb-12">
            <main className="container max-w-2xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent flex items-center gap-3">
                            <TrendingUp className="w-8 h-8 text-primary" />
                            환율 설정
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            해외 결제 임포트 시 사용할 기준 환율(fallback)입니다.
                            실시간 API 연결 실패 시 이 값이 사용됩니다.
                        </p>
                    </div>
                </div>

                {/* 실시간 환율 조회 */}
                <div className="glass-panel p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">실시간 환율 참고</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleFetchLive}
                            disabled={fetching}
                            className="gap-2"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${fetching ? 'animate-spin' : ''}`} />
                            {fetching ? '조회 중...' : '현재 환율 조회'}
                        </Button>
                    </div>

                    {liveRates && (
                        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 space-y-3">
                            <p className="text-xs text-green-400 font-medium">📡 실시간 환율 (exchangerate-api.com)</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                {FX_CURRENCIES.map(({ currency, flag }) => (
                                    <div key={currency} className="flex justify-between">
                                        <span className="text-muted-foreground">{flag} {currency}</span>
                                        <span className="font-medium text-green-400">
                                            ₩{liveRates[currency]?.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <Button size="sm" onClick={applyLiveRates} className="w-full bg-green-600 hover:bg-green-700">
                                실시간 환율을 아래에 적용
                            </Button>
                        </div>
                    )}
                </div>

                {/* Fallback 환율 편집 */}
                <div className="glass-panel p-5 space-y-5">
                    <p className="text-sm font-medium">Fallback 환율 설정 (1 외화 = ? 원)</p>

                    {FX_CURRENCIES.map(({ currency, label, flag }) => (
                        <div key={currency} className="flex items-center gap-4">
                            <div className="w-32 flex items-center gap-2 shrink-0">
                                <span className="text-xl">{flag}</span>
                                <div>
                                    <p className="text-sm font-medium">{currency}</p>
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                </div>
                            </div>
                            <div className="flex-1 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₩</span>
                                <Input
                                    type="number"
                                    value={rates[currency] ?? FX_FALLBACK_RATES[currency] ?? 0}
                                    onChange={e =>
                                        setRates(prev => ({
                                            ...prev,
                                            [currency]: parseFloat(e.target.value) || 0,
                                        }))
                                    }
                                    className="pl-8"
                                    step={0.1}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground w-24 text-right">
                                1 {currency} =<br />
                                <span className="font-medium text-foreground">
                                    ₩{(rates[currency] ?? 0).toLocaleString()}
                                </span>
                            </p>
                        </div>
                    ))}

                    <div className="pt-2 border-t border-border/40 flex justify-end">
                        <Button onClick={handleSave} disabled={saving} className="gap-2">
                            <Save className="w-4 h-4" />
                            {saving ? '저장 중...' : '저장'}
                        </Button>
                    </div>
                </div>

                {/* 안내 */}
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg text-sm text-primary/80 flex gap-3">
                    <span>💡</span>
                    <div className="space-y-1">
                        <p className="font-medium">환율 적용 우선순위</p>
                        <p className="text-xs">
                            임포트 시 <strong>①실시간 API</strong> → 실패 시 <strong>②여기서 설정한 Fallback</strong>
                            순서로 적용됩니다. 요즘 환율이 1400원 이하로 잘 안 내려가므로
                            보수적으로 약간 높게 설정해두는 것을 권장합니다.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
