'use client'

import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { Category } from '@/entities/category/model/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { upsertCategory } from '../api/upsert-category';
import { cn } from '@/shared/lib/utils';

// Filter only actual icons (not internal components or types)
const ICON_LIST = Object.entries(LucideIcons)
    .filter(([name, icon]) => typeof icon === 'function' || (typeof icon === 'object' && 'displayName' in (icon as any)))
    .map(([name]) => name)
    .slice(0, 50); // Limit to top 50 for simplicity in this version

const COLORS = [
    { name: 'Slate', value: 'slate' },
    { name: 'Red', value: 'red' },
    { name: 'Orange', value: 'orange' },
    { name: 'Amber', value: 'amber' },
    { name: 'Yellow', value: 'yellow' },
    { name: 'Lime', value: 'lime' },
    { name: 'Green', value: 'green' },
    { name: 'Emerald', value: 'emerald' },
    { name: 'Teal', value: 'teal' },
    { name: 'Sky', value: 'sky' },
    { name: 'Blue', value: 'blue' },
    { name: 'Indigo', value: 'indigo' },
    { name: 'Violet', value: 'violet' },
    { name: 'Purple', value: 'purple' },
    { name: 'Pink', value: 'pink' },
    { name: 'Rose', value: 'rose' },
];

interface CategoryFormDialogProps {
    category?: Category;
    parent_id?: number | null;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const COLOR_MAP: Record<string, string> = {
    slate: 'bg-slate-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    amber: 'bg-amber-500',
    yellow: 'bg-yellow-500',
    lime: 'bg-lime-500',
    green: 'bg-green-500',
    emerald: 'bg-emerald-500',
    teal: 'bg-teal-500',
    sky: 'bg-sky-500',
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    violet: 'bg-violet-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    rose: 'bg-rose-500',
};

export function CategoryFormDialog({ category, parent_id, trigger, open: controlledOpen, onOpenChange }: CategoryFormDialogProps) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    const open = controlledOpen ?? uncontrolledOpen;
    const setOpen = onOpenChange ?? setUncontrolledOpen;

    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(category?.name ?? '');
    const [type, setType] = useState<'income' | 'expense' | 'transfer'>(category?.type ?? 'expense');
    const [icon, setIcon] = useState(category?.ui_config?.icon ?? 'Package');
    const [color, setColor] = useState(category?.ui_config?.color ?? 'slate');
    const [isBusinessOnly, setIsBusinessOnly] = useState(category?.is_business_only ?? false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const result = await upsertCategory({
            id: category?.id,
            name,
            parent_id: category?.parent_id ?? parent_id ?? null,
            type,
            is_business_only: isBusinessOnly,
            ui_config: { icon, color }
        });

        setIsLoading(false);
        if (result.success) {
            setOpen(false);
        } else {
            alert(result.message);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-md glass-panel">
                <DialogHeader>
                    <DialogTitle>{category ? '카테고리 수정' : '새 카테고리 추가'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">이름</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="카테고리 이름을 입력하세요" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>유형</Label>
                            <Select value={type} onValueChange={(v: any) => setType(v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="유형 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="expense">지출</SelectItem>
                                    <SelectItem value="income">수입</SelectItem>
                                    <SelectItem value="transfer">이체</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>비즈니스 전용</Label>
                            <div className="flex items-center space-x-2 pt-2">
                                <Switch checked={isBusinessOnly} onCheckedChange={setIsBusinessOnly} />
                                <span className="text-sm text-muted-foreground">{isBusinessOnly ? 'On' : 'Off'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>아이콘</Label>
                            <Select value={icon} onValueChange={setIcon}>
                                <SelectTrigger>
                                    <div className="flex items-center gap-2">
                                        {React.createElement((LucideIcons as any)[icon] || LucideIcons.Package, { className: "w-4 h-4" })}
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {ICON_LIST.map((i) => (
                                        <SelectItem key={i} value={i}>
                                            <div className="flex items-center gap-2">
                                                {React.createElement((LucideIcons as any)[i], { className: "w-4 h-4" })}
                                                {i}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>색상</Label>
                            <Select value={color} onValueChange={setColor}>
                                <SelectTrigger>
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-3 h-3 rounded-full border border-white/10", COLOR_MAP[color])} />
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {COLORS.map((c) => (
                                        <SelectItem key={c.value} value={c.value}>
                                            <div className="flex items-center gap-2">
                                                <div className={cn("w-3 h-3 rounded-full border border-white/10", COLOR_MAP[c.value])} />
                                                {c.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? '저장 중...' : '저장하기'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
