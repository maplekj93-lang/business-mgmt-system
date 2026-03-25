"use client"

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog'
import { ClientSelect } from '@/entities/client/ui/ClientSelect'
import {
    OWNER_TYPES, OWNER_LABELS,
    INCOME_TYPES, INCOME_TYPE_LABELS,
    PROJECT_CATEGORIES,
    type OwnerType,
} from '@/shared/constants/business'
import { createProject } from '../api/create-project'
import type { Project } from '../model/types'
import { cn } from '@/shared/lib/utils'

interface CreateProjectModalProps {
    open: boolean
    onClose: () => void
    onCreated: (p: Project) => void
    defaultOwner?: OwnerType
    defaultIncomeType?: string
}

export function CreateProjectModal({ 
    open, 
    onClose, 
    onCreated,
    defaultOwner = 'kwangjun',
    defaultIncomeType = 'freelance'
}: CreateProjectModalProps) {
    const [name, setName] = useState('')
    const [clientId, setClientId] = useState('')
    const [owner, setOwner] = useState<OwnerType>(defaultOwner)
    const [incomeType, setIncomeType] = useState(defaultIncomeType)
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [startDate, setStartDate] = useState('')
    const [deadline, setDeadline] = useState('')
    const [memo, setMemo] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    function reset() {
        setName(''); setClientId(''); setOwner(defaultOwner); setIncomeType(defaultIncomeType)
        setSelectedCategories([]); setStartDate(''); setDeadline(''); setMemo('')
    }

    function toggleCategory(c: string) {
        setSelectedCategories(prev =>
            prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
        )
    }

    async function handleSubmit() {
        if (!name.trim()) return
        setIsSubmitting(true)
        try {
            const project = await createProject({
                name: name.trim(),
                client_id: clientId || undefined,
                business_owner: owner,
                income_type: incomeType as any,
                categories: selectedCategories,
                status: 'active',
                start_date: startDate || undefined,
                deadline: deadline || undefined,
                memo: memo || undefined,
                checklist: [],
            })
            onCreated(project)
            reset()
            onClose()
        } catch {
            alert('프로젝트 생성 중 오류가 발생했습니다.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5 text-blue-500" /> 새 프로젝트
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="grid gap-1.5">
                        <Label>프로젝트명 *</Label>
                        <Input placeholder="예: 현대차 CF 2026" value={name} onChange={e => setName(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label>담당자</Label>
                            <Select value={owner} onValueChange={v => setOwner(v as OwnerType)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {OWNER_TYPES.map(o => (
                                        <SelectItem key={o} value={o}>{OWNER_LABELS[o]}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label>수입 유형</Label>
                            <Select value={incomeType} onValueChange={setIncomeType}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {INCOME_TYPES.map(t => (
                                        <SelectItem key={t} value={t}>{INCOME_TYPE_LABELS[t]}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-1.5">
                        <Label>거래처</Label>
                        <ClientSelect value={clientId} onValueChange={setClientId} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label>시작일</Label>
                            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>마감일</Label>
                            <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid gap-1.5">
                        <Label>카테고리</Label>
                        <div className="flex flex-wrap gap-1.5">
                            {PROJECT_CATEGORIES.map(c => (
                                <button
                                    key={c}
                                    onClick={() => toggleCategory(c)}
                                    className={cn(
                                        'text-xs px-2 py-1 rounded-full  transition-colors',
                                        selectedCategories.includes(c)
                                            ? 'bg-primary text-white border-blue-600'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                    )}
                                >{c}</button>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-1.5">
                        <Label>메모</Label>
                        <textarea
                            className="w-full rounded-md border-input bg-background px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="특이사항, 담당자 연락처 등"
                            value={memo}
                            onChange={e => setMemo(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>취소</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !name.trim()} className="bg-primary hover:bg-blue-700">
                        {isSubmitting ? '생성 중...' : '프로젝트 생성'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
