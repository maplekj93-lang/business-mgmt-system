"use client"

import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { FileText, Plus, Trash2 } from 'lucide-react'
import { QuoteTemplate } from './QuoteTemplate'
import { Project } from '@/entities/project'

interface CreateQuoteDialogProps {
    project: Project;
    profile: any;
}

export function CreateQuoteDialog({ project, profile }: CreateQuoteDialogProps) {
    const [items, setItems] = useState<{ description: string; quantity: number; price: number }[]>([
        { description: project.name, quantity: 1, price: 0 }
    ]);
    const [isPreview, setIsPreview] = useState(false);

    const addItem = () => setItems([...items, { description: '', quantity: 1, price: 0 }]);
    const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

    const updateItem = (idx: number, field: string, value: string | number) => {
        const newItems = [...items];
        (newItems[idx] as any)[field] = value;
        setItems(newItems);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <FileText className="h-4 w-4" /> 견적서 생성
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>견적서 생성 - {project.name}</DialogTitle>
                </DialogHeader>

                {!isPreview ? (
                    <div className="space-y-6 py-4">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-base">항목 설정</Label>
                                <Button size="sm" variant="ghost" onClick={addItem}>
                                    <Plus className="h-4 w-4 mr-1" /> 항목 추가
                                </Button>
                            </div>

                            {items.map((item, idx) => (
                                <div key={idx} className="flex gap-4 items-end border-b pb-4 last:border-0">
                                    <div className="flex-1 space-y-1.5">
                                        <Label className="text-xs">설명 (Description)</Label>
                                        <Input
                                            value={item.description}
                                            onChange={e => updateItem(idx, 'description', e.target.value)}
                                            placeholder="홍보 영상 조명 작업"
                                        />
                                    </div>
                                    <div className="w-20 space-y-1.5">
                                        <Label className="text-xs">수량</Label>
                                        <Input
                                            type="number"
                                            value={item.quantity}
                                            onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="w-32 space-y-1.5">
                                        <Label className="text-xs">단가 (Price)</Label>
                                        <Input
                                            type="number"
                                            value={item.price}
                                            onChange={e => updateItem(idx, 'price', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive"
                                        onClick={() => removeItem(idx)}
                                        disabled={items.length === 1}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t">
                            <div className="text-lg font-bold">
                                예상 합계: {items.reduce((s, i) => s + (i.quantity * i.price), 0).toLocaleString()}원
                            </div>
                            <Button className="bg-primary hover:bg-blue-700" onClick={() => setIsPreview(true)}>
                                미리보기 및 출력
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Button variant="ghost" size="sm" onClick={() => setIsPreview(false)}>
                            ← 편집으로 돌아가기
                        </Button>
                        <QuoteTemplate project={project} profile={profile} items={items} />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
