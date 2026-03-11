'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Trash2, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import {
    getCrewProfiles,
    createCrewProfile,
    updateCrewProfile,
    deleteCrewProfile,
} from '@/entities/crew/api/crew-api';
import { CrewProfile, CREW_ROLES, DEFAULT_WITHHOLDING_RATES } from '@/entities/crew/model/types';

export default function CrewSettingsPage() {
    const [crews, setCrews] = useState<CrewProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        loadCrews();
    }, []);

    const loadCrews = async () => {
        setLoading(true);
        try {
            const data = await getCrewProfiles();
            setCrews(data || []);
        } catch {
            toast.error('크루 목록을 불러오지 못했습니다.');
        }
        setLoading(false);
    };

    const handleAdd = async () => {
        setSaving('new');
        try {
            const newCrew = await createCrewProfile({
                name: '새 크루',
                role: '기타',
                withholding_rate: 0.033,
                account_info: null,
                phone: null,
                is_active: true,
                notes: null,
            });
            setCrews(prev => [...prev, newCrew]);
            toast.success('새 크루가 추가되었습니다.');
        } catch {
            toast.error('크루 추가에 실패했습니다.');
        }
        setSaving(null);
    };

    const handleUpdate = async (id: string, updates: Partial<Omit<CrewProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
        setCrews(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
        try {
            await updateCrewProfile(id, updates);
        } catch {
            toast.error('저장에 실패했습니다.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('이 크루를 삭제하시겠습니까?')) return;
        setSaving(id);
        try {
            await deleteCrewProfile(id);
            setCrews(prev => prev.filter(c => c.id !== id));
            toast.success('삭제되었습니다.');
        } catch {
            toast.error('삭제에 실패했습니다.');
        }
        setSaving(null);
    };

    const handleRoleChange = (id: string, role: string) => {
        const rate = DEFAULT_WITHHOLDING_RATES[role] ?? 0.033;
        handleUpdate(id, { role, withholding_rate: rate });
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">불러오는 중...</div>;

    return (
        <div className="pb-20">
            <main className="container max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent flex items-center gap-3">
                            <Users className="w-8 h-8 text-primary" />
                            크루 프로필 관리
                        </h2>
                        <p className="text-muted-foreground">
                            함께 일하는 크루의 정보와 원천징수율을 관리합니다.
                        </p>
                    </div>
                    <Button variant="outline" onClick={handleAdd} disabled={!!saving} className="rounded-full">
                        <Plus className="w-4 h-4 mr-2" />
                        새 크루 추가
                    </Button>
                </div>

                <div className="tactile-panel overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b">
                                    <th className="px-4 py-3 font-semibold text-muted-foreground">이름</th>
                                    <th className="px-4 py-3 font-semibold text-muted-foreground w-36">역할</th>
                                    <th className="px-4 py-3 font-semibold text-muted-foreground w-32">원천징수율</th>
                                    <th className="px-4 py-3 font-semibold text-muted-foreground">계좌 정보</th>
                                    <th className="px-4 py-3 font-semibold text-muted-foreground w-36">연락처</th>
                                    <th className="px-4 py-3 font-semibold text-muted-foreground w-16 text-center">삭제</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {crews.map(crew => (
                                    <tr key={crew.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-2">
                                            <Input
                                                className="h-8 p-0 border-none bg-transparent shadow-none focus-visible:ring-0 font-medium"
                                                value={crew.name}
                                                onChange={e => setCrews(prev => prev.map(c => c.id === crew.id ? { ...c, name: e.target.value } : c))}
                                                onBlur={e => handleUpdate(crew.id, { name: e.target.value })}
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <Select
                                                value={crew.role ?? '기타'}
                                                onValueChange={v => handleRoleChange(crew.id, v)}
                                            >
                                                <SelectTrigger className="h-8 border-none bg-transparent shadow-none focus:ring-0">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {CREW_ROLES.map(role => (
                                                        <SelectItem key={role} value={role}>{role}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="px-4 py-2">
                                            <Input
                                                className="h-8 p-0 border-none bg-transparent shadow-none focus-visible:ring-0 text-center"
                                                type="number"
                                                step="0.001"
                                                min="0"
                                                max="1"
                                                value={crew.withholding_rate}
                                                onChange={e => setCrews(prev => prev.map(c => c.id === crew.id ? { ...c, withholding_rate: parseFloat(e.target.value) } : c))}
                                                onBlur={e => handleUpdate(crew.id, { withholding_rate: parseFloat(e.target.value) })}
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <Input
                                                className="h-8 p-0 border-none bg-transparent shadow-none focus-visible:ring-0 text-sm"
                                                placeholder="예: 국민은행 123-456-789"
                                                value={crew.account_info ?? ''}
                                                onChange={e => setCrews(prev => prev.map(c => c.id === crew.id ? { ...c, account_info: e.target.value } : c))}
                                                onBlur={e => handleUpdate(crew.id, { account_info: e.target.value || null })}
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <Input
                                                className="h-8 p-0 border-none bg-transparent shadow-none focus-visible:ring-0 text-sm"
                                                placeholder="010-0000-0000"
                                                value={crew.phone ?? ''}
                                                onChange={e => setCrews(prev => prev.map(c => c.id === crew.id ? { ...c, phone: e.target.value } : c))}
                                                onBlur={e => handleUpdate(crew.id, { phone: e.target.value || null })}
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDelete(crew.id)}
                                                disabled={saving === crew.id}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {crews.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground border-t">
                                등록된 크루가 없습니다. '새 크루 추가'를 눌러주세요.
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-primary/5 border-primary/20 p-4 rounded-lg flex items-start gap-4 text-sm text-primary/80">
                    <div className="mt-0.5">💡</div>
                    <div className="space-y-1">
                        <p className="font-semibold">원천징수율 안내</p>
                        <p>• 역할을 선택하면 기본 원천징수율(3.3%)이 자동 설정됩니다.</p>
                        <p>• 광준의 경우 원천징수율을 <b>0</b>으로 설정하세요.</p>
                        <p>• 입력 후 다른 곳을 클릭하면 자동 저장됩니다.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
