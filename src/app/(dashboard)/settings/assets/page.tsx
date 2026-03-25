'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Trash2, Plus, Wallet, Eye, EyeOff, Save } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { getAssets } from '@/entities/asset/api/get-assets';
import { createAsset, updateAsset, deleteAsset } from '@/entities/asset/api/actions';
import { Asset, AssetType, OwnerType } from '@/entities/asset/model/schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
    bank_account: '은행 계좌',
    credit_card: '신용카드',
    debit_card: '체크카드',
    cash: '현금',
    pay_proxy: '간편결제',
    investment: '투자',
    insurance: '보험',
    debt: '부채',
    other: '기타'
};

const PAYMENT_METHOD_TYPES: AssetType[] = ['credit_card', 'debit_card', 'pay_proxy'];

const OWNER_TYPE_LABELS: Record<OwnerType, string> = {
    kwangjun: '광준',
    euiyoung: '의영',
    joint: '광영부부 (공용)',
    business: '사업자',
    other: '기타'
};

export default function AssetSettingsPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        loadAssets();
    }, []);

    const loadAssets = async () => {
        setLoading(true);
        const data = await getAssets();
        // 보유 자산 탭에서는 결제수단(카드/간편결제) 제외
        const filtered = (data || []).filter(a => !PAYMENT_METHOD_TYPES.includes(a.asset_type));
        setAssets(filtered);
        setLoading(false);
    };

    const handleAddAsset = async () => {
        const tempId = crypto.randomUUID();
        setSaving(tempId);

        const newAsset = {
            name: '새 자산',
            asset_type: 'bank_account' as const,
            owner_type: 'kwangjun' as const,
            identifier_keywords: [],
            is_hidden: false,
            memo: ''
        };

        const result = await createAsset(newAsset);

        if (result.error) {
            toast.error('자산 추가 실패: ' + result.error);
        } else if (result.data) {
            setAssets(prev => [...prev, result.data as Asset]);
            toast.success('새 자산이 추가되었습니다');
        }
        setSaving(null);
    };

    const handleDeleteAsset = async (id: string) => {
        if (!confirm('이 자산을 삭제하시겠습니까? 거래 내역이 연결되어 있다면 문제가 발생할 수 있습니다.')) return;

        setSaving(id);
        const result = await deleteAsset(id);

        if (result.error) {
            toast.error('단일 데이터 삭제 실패: ' + result.error);
        } else {
            setAssets(prev => prev.filter(a => a.id !== id));
            toast.success('삭제 완료');
        }
        setSaving(null);
    };

    const handleUpdateAsset = async (id: string, updates: Partial<Asset>) => {
        // Optimistic UI Data Update
        setAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));

        // Background sync to server
        const result = await updateAsset(id, updates);
        if (result.error) {
            toast.error('자동 저장 실패: ' + result.error);
            // Revert on next load implicitly or manually fetch again
        }
    };

    const getKeywordString = (keywords: string[] | null) => {
        return keywords ? keywords.join(', ') : '';
    };

    const handleKeywordChange = (id: string, value: string) => {
        const keywordsArray = value.split(',').map(k => k.trim()).filter(Boolean);
        handleUpdateAsset(id, { identifier_keywords: keywordsArray });
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">목록을 불러오는 중입니다...</div>;

    return (
        <div className="pb-20">

            <main className="container max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent flex items-center gap-3">
                            <Wallet className="w-8 h-8 text-primary" />
                            자산 설정 관리
                        </h2>
                        <p className="text-muted-foreground">
                            현금, 통장, 카드 등 거래가 일어나는 자산 소스들을 식별 조건과 함께 관리하세요.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleAddAsset} disabled={!!saving} className="rounded-full">
                            <Plus className="w-4 h-4 mr-2" />
                            신규 생성
                        </Button>
                    </div>
                </div>

                <div className="tactile-panel overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b">
                                    <th className="px-4 py-3 font-semibold text-muted-foreground w-12 text-center">#</th>
                                    <th className="px-4 py-3 font-semibold text-muted-foreground w-40">자산 이름</th>
                                    <th className="px-4 py-3 font-semibold text-muted-foreground w-40">종류</th>
                                    <th className="px-4 py-3 font-semibold text-muted-foreground w-44">소유자명</th>
                                    <th className="px-4 py-3 font-semibold text-muted-foreground min-w-[200px]">식별 키워드 (쉼표 구분)</th>
                                    <th className="px-4 py-3 font-semibold text-muted-foreground w-48">메모</th>
                                    <th className="px-4 py-3 font-semibold text-muted-foreground w-28 text-center">상태/편집</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {assets.map((asset, index) => (
                                    <tr
                                        key={asset.id}
                                        className={cn(
                                            "hover:bg-white/[0.02] transition-colors group",
                                            asset.is_hidden && "opacity-40 grayscale-[0.5]"
                                        )}
                                    >
                                        <td className="px-4 py-2 text-center text-muted-foreground/50 font-mono text-xs">
                                            {index + 1}
                                        </td>

                                        <td className="px-4 py-2">
                                            <Input
                                                className="h-8 p-0 border-none bg-transparent shadow-none focus-visible:ring-0 font-medium whitespace-nowrap overflow-hidden text-ellipsis"
                                                value={asset.name}
                                                onChange={(e) => setAssets(assets.map(a => a.id === asset.id ? { ...a, name: e.target.value } : a))}
                                                onBlur={(e) => handleUpdateAsset(asset.id, { name: e.target.value })}
                                            />
                                        </td>

                                        <td className="px-2 py-2">
                                            <Select
                                                value={asset.asset_type}
                                                onValueChange={(v) => handleUpdateAsset(asset.id, { asset_type: v as AssetType })}
                                            >
                                                <SelectTrigger className="h-8 border-none bg-transparent shadow-none focus:ring-0">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(ASSET_TYPE_LABELS)
                                                        .filter(([val]) => !PAYMENT_METHOD_TYPES.includes(val as AssetType))
                                                        .map(([val, label]) => (
                                                            <SelectItem key={val} value={val}>{label}</SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </td>

                                        <td className="px-2 py-2">
                                            <Select
                                                value={asset.owner_type}
                                                onValueChange={(v) => handleUpdateAsset(asset.id, { owner_type: v as OwnerType })}
                                            >
                                                <SelectTrigger className="h-8 border-none bg-transparent shadow-none focus:ring-0">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(OWNER_TYPE_LABELS).map(([val, label]) => (
                                                        <SelectItem key={val} value={val}>{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>

                                        <td className="px-4 py-2">
                                            <Input
                                                className="h-8 p-0 border-none bg-transparent shadow-none focus-visible:ring-0 text-sm placeholder:text-muted-foreground/30"
                                                placeholder="예: 우리은행, 2195, 가족카드"
                                                defaultValue={getKeywordString(asset.identifier_keywords)}
                                                onBlur={(e) => handleKeywordChange(asset.id, e.target.value)}
                                            />
                                        </td>

                                        <td className="px-4 py-2">
                                            <Input
                                                className="h-8 p-0 border-none bg-transparent shadow-none focus-visible:ring-0 text-xs text-muted-foreground italic"
                                                placeholder="메모를 입력하세요."
                                                value={asset.memo || ''}
                                                onChange={(e) => setAssets(assets.map(a => a.id === asset.id ? { ...a, memo: e.target.value } : a))}
                                                onBlur={(e) => handleUpdateAsset(asset.id, { memo: e.target.value })}
                                            />
                                        </td>

                                        <td className="px-4 py-2 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                                                    onClick={() => handleUpdateAsset(asset.id, { is_hidden: !asset.is_hidden })}
                                                    title={asset.is_hidden ? '숨김 해제하기' : '숨기기'}
                                                >
                                                    {asset.is_hidden ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground/30" /> : <Eye className="w-3.5 h-3.5" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleDeleteAsset(asset.id)}
                                                    disabled={saving === asset.id}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {assets.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground border-t">
                                생성된 자산이 없습니다. '신규 생성'을 눌러 추가해주세요.
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-primary/5 border-primary/20 p-4 rounded-lg flex items-start gap-4 text-sm text-primary/80">
                    <div className="mt-0.5">💡</div>
                    <div className="space-y-1">
                        <p className="font-semibold">자산 및 키워드 연동 안내</p>
                        <p>• <b>식별 키워드:</b> 엑셀 업로드 시 파일에 기재된 '은행명'이나 '카드번호'가 이 키워드에 포함되어 있으면 자동으로 자산이 연결됩니다. (예: `KB국민`, `7421` 등)</p>
                        <p>• 내용 변경 시 <b>입력 칸 바깥(다른 곳)을 클릭(블러)하면 자동으로 저장됩니다.</b></p>
                    </div>
                </div>
            </main>
        </div>
    );
}
