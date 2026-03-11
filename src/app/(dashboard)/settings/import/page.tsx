'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/shared/api/supabase/client';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Trash2, Plus, Download, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Mapping {
    id: string;
    type: 'bank_name' | 'card_no' | 'account_no';
    source_value: string;
    target_asset_id: string;
}

interface Asset {
    id: string;
    name: string;
}

export default function ImportSettingsPage() {
    const supabase = createClient();
    const [mappings, setMappings] = useState<Mapping[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const loadInitialData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            const [mappingsRes, assetsRes] = await Promise.all([
                supabase.from('mdt_import_mappings' as any).select('*'),
                supabase.from('assets').select('id, name')
            ]);
            if (mappingsRes.data) setMappings(mappingsRes.data as any);
            if (assetsRes.data) setAssets(assetsRes.data);
            setLoading(false);
        };
        loadInitialData();
    }, []);

    const addMapping = () => {
        setMappings([...mappings, { id: crypto.randomUUID(), type: 'bank_name', source_value: '', target_asset_id: assets[0]?.id || '' }]);
    };

    const removeMapping = (id: string) => {
        setMappings(mappings.filter(m => m.id !== id));
    };

    const updateMapping = (id: string, updates: Partial<Mapping>) => {
        setMappings(mappings.map(m => m.id === id ? { ...m, ...updates } : m));
    };

    const saveMappings = async () => {
        if (!user) return;
        setSaving(true);

        try {
            // Transaction-like update: Delete all and Insert all (simplest way to sync state)
            const { error: delError } = await supabase
                .from('mdt_import_mappings' as any)
                .delete()
                .eq('user_id', user.id);

            if (delError) throw delError;

            if (mappings.length > 0) {
                const { error: insError } = await (supabase
                    .from('mdt_import_mappings' as any)
                    .insert(mappings.map(m => ({
                        user_id: user.id,
                        type: m.type,
                        source_value: m.source_value,
                        target_asset_id: m.target_asset_id
                    })) as any) as any);
                if (insError) throw insError;
            }

            toast.success('설정이 저장되었습니다');
        } catch (error: any) {
            console.error('Save failed:', error);
            toast.error(`저장 실패: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">로드 중...</div>;

    return (
        <div className="pb-12">
            <main className="container max-w-4xl mx-auto p-4 md:p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent flex items-center gap-3">
                            <Download className="w-8 h-8 text-primary" />
                            가져오기 설정
                        </h2>
                        <p className="text-muted-foreground">
                            엑셀 파일에 명시된 은행 이름이나 카드 번호를 자산(카드/계좌)과 고정적으로 연결합니다.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={addMapping} className="rounded-full">
                            <Plus className="w-4 h-4 mr-2" />
                            규칙 추가
                        </Button>
                        <Button onClick={saveMappings} disabled={saving} className="rounded-full">
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? '저장 중...' : '전체 저장'}
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    {mappings.length === 0 ? (
                        <div className="tactile-panel p-12 text-center text-muted-foreground">
                            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>아직 설정된 규칙이 없습니다. '규칙 추가'를 눌러 시작하세요.</p>
                        </div>
                    ) : (
                        mappings.map((mapping) => (
                            <div key={mapping.id} className="tactile-panel p-4 flex flex-col md:flex-row gap-4 items-center animate-in fade-in slide-in-from-top-2">
                                <div className="w-full md:w-32">
                                    <Select value={mapping.type} onValueChange={(v: any) => updateMapping(mapping.id, { type: v })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bank_name">은행/카드사</SelectItem>
                                            <SelectItem value="card_no">카드번호</SelectItem>
                                            <SelectItem value="account_no">계좌번호</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex-1 w-full">
                                    <Input
                                        placeholder={mapping.type === 'bank_name' ? '예: SAMSUNGCARD' : '예: 1234 (뒷자리)'}
                                        value={mapping.source_value}
                                        onChange={(e) => updateMapping(mapping.id, { source_value: e.target.value })}
                                    />
                                </div>

                                <div className="hidden md:block text-muted-foreground">→</div>

                                <div className="w-full md:w-64">
                                    <Select
                                        value={mapping.target_asset_id}
                                        onValueChange={(v) => updateMapping(mapping.id, { target_asset_id: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="연결할 자산 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {assets.map(asset => (
                                                <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeMapping(mapping.id)}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>

                <div className="bg-amber-500/10 border-amber-500/20 p-4 rounded-lg text-sm text-amber-200/80 flex gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <div>
                        <p className="font-semibold mb-1">도움말: 매칭 우선순위</p>
                        <p>1. 여기서 설정한 수동 규칙이 가장 먼저 적용됩니다.</p>
                        <p>2. 규칙이 없을 경우 엑셀의 카드번호 뒷자리와 자산 이름의 매칭을 시도합니다.</p>
                        <p>3. 마지막으로 은행 이름 기반의 자동 매칭을 시도합니다.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
