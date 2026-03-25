"use client"

import { useState, useEffect } from 'react'
import { Check, Trash2, ChevronDown, ChevronUp, Plus, Link as LinkIcon, FileText, CreditCard, History, Info } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Checkbox } from '@/shared/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { updateProject } from '@/entities/project/api/update-project'
import { deleteProject } from '@/entities/project/api/delete-project'
import { CreateQuoteDialog } from '@/features/create-quote/ui/CreateQuoteDialog'
import { MatchIncomeDialog } from '@/features/match-income/ui/MatchIncomeDialog'
import {
    OWNER_TYPES, OWNER_LABELS, OWNER_COLORS,
    PROJECT_STATUSES, PROJECT_STATUS_LABELS,
    type OwnerType, type ProjectStatus,
} from '@/shared/constants/business'
import type { Project, ChecklistItem } from '@/entities/project/model/types'
import { cn } from '@/shared/lib/utils'

interface ProjectDetailModalProps {
    project: Project;
    profiles: any[];
    open: boolean;
    onClose: () => void;
    onUpdated: (p: Project) => void;
    onDeleted: (id: string) => void;
}

const PIPELINE_DONE_STATUSES = ['입금완료', '포스팅완료']

export function ProjectDetailModal({ project: initial, profiles, open, onClose, onUpdated, onDeleted }: ProjectDetailModalProps) {
    const [project, setProject] = useState(initial)
    const [newTodo, setNewTodo] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [showMemo, setShowMemo] = useState(!!initial.memo)
    const [matchingIncome, setMatchingIncome] = useState<{ id: string; title: string; amount: number } | null>(null)
    const [activeTab, setActiveTab] = useState('info')

    // Find the profile matching the project owner
    const activeProfile = profiles.find(p => p.owner_type === initial.business_owner) || profiles[0];

    useEffect(() => { 
        setProject(initial) 
        setShowMemo(!!initial.memo) 
    }, [initial])

    async function save(patch: Partial<Project>) {
        const updated = { ...project, ...patch }
        setProject(updated)
        setIsSaving(true)
        try {
            await updateProject(project.id, patch)
            onUpdated(updated)
        } catch {
            setProject(project) // rollback
            alert('저장 중 오류가 발생했습니다.')
        } finally {
            setIsSaving(false)
        }
    }

    async function addTodo() {
        if (!newTodo.trim()) return
        const item: ChecklistItem = { id: crypto.randomUUID(), text: newTodo.trim(), done: false }
        const checklist = [...(project.checklist ?? []), item]
        setNewTodo('')
        await save({ checklist })
    }

    async function toggleTodo(id: string) {
        const checklist = (project.checklist ?? []).map(i => i.id === id ? { ...i, done: !i.done } : i)
        await save({ checklist })
    }

    async function deleteTodo(id: string) {
        const checklist = (project.checklist ?? []).filter(i => i.id !== id)
        await save({ checklist })
    }

    async function handleDelete() {
        if (!confirm(`"${project.name}" 프로젝트를 삭제할까요?`)) return
        try {
            await deleteProject(project.id)
            onDeleted(project.id)
            onClose()
        } catch {
            alert('삭제 중 오류가 발생했습니다.')
        }
    }

    const checkProgress = project.checklist?.length 
        ? { done: project.checklist.filter(i => i.done).length, total: project.checklist.length }
        : null
    
    const incomes = project.project_incomes ?? []

    // 5-stage timeline logic
    const stages = [
        { label: '견적수립', key: 'quote', isDone: !!project.quote_sent_date },
        { label: '프로젝트시작', key: 'start', isDone: !!project.start_date },
        { label: '계산서발행', key: 'invoice', isDone: !!project.invoice_sent_date },
        { label: '입금완료', key: 'payment', isDone: incomes.length > 0 && incomes.every(i => PIPELINE_DONE_STATUSES.includes(i.status)) },
        { label: '최종종료', key: 'end', isDone: project.status === 'completed' },
    ]

    const currentStageIndex = stages.findLastIndex(s => s.isDone)
    
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                            <div className={cn('w-1.5 h-8 rounded-full flex-shrink-0', OWNER_COLORS[project.business_owner])} />
                            <div className="flex flex-col flex-1">
                                <input
                                    className="text-xl font-bold bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-400 focus:outline-none transition-colors py-0.5"
                                    value={project.name}
                                    onChange={e => setProject(p => ({ ...p, name: e.target.value }))}
                                    onBlur={e => save({ name: e.target.value.trim() || project.name })}
                                />
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-muted-foreground">{project.client?.name || '고객사 미지정'}</span>
                                    <span className="text-[10px] text-slate-300">|</span>
                                    <span className="text-xs text-muted-foreground">{OWNER_LABELS[project.business_owner]}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             {activeProfile && (
                                <CreateQuoteDialog project={project} profile={activeProfile} />
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                    {/* Status Timeline */}
                    <div className="relative flex justify-between items-start pt-2 px-2">
                        {/* Connection Line */}
                        <div className="absolute top-6 left-10 right-10 h-0.5 bg-slate-100 -z-10" />
                        <div 
                            className="absolute top-6 left-10 h-0.5 bg-blue-500 -z-10 transition-all duration-500" 
                            style={{ width: `${Math.max(0, currentStageIndex) * (100 / (stages.length - 1))}%` }}
                        />

                        {stages.map((stage, idx) => (
                            <div key={stage.key} className="flex flex-col items-center gap-2 w-20">
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white",
                                    stage.isDone 
                                        ? "border-blue-500 text-blue-500 shadow-sm" 
                                        : (idx === currentStageIndex + 1 ? "border-slate-300 text-slate-400" : "border-slate-100 text-slate-200")
                                )}>
                                    {stage.isDone ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                                </div>
                                <span className={cn(
                                    "text-[11px] font-bold text-center",
                                    stage.isDone ? "text-slate-900" : "text-slate-400"
                                )}>{stage.label}</span>
                            </div>
                        ))}
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="bg-slate-100/50 p-1 rounded-lg w-full justify-start gap-1">
                            <TabsTrigger value="info" className="flex items-center gap-1.5 px-4 py-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <Info className="h-3.5 w-3.5" /> 기본 정보
                            </TabsTrigger>
                            <TabsTrigger value="settlement" className="flex items-center gap-1.5 px-4 py-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <CreditCard className="h-3.5 w-3.5" /> 정산 관리
                            </TabsTrigger>
                            <TabsTrigger value="history" className="flex items-center gap-1.5 px-4 py-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <History className="h-3.5 w-3.5" /> 히스토리
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-6">
                            <TabsContent value="info" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] text-slate-500 font-bold uppercase">담당자</Label>
                                        <Select value={project.business_owner} onValueChange={v => save({ business_owner: v as OwnerType })}>
                                            <SelectTrigger className="h-9 text-sm focus:ring-blue-500">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {OWNER_TYPES.map(o => <SelectItem key={o} value={o}>{OWNER_LABELS[o]}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] text-slate-500 font-bold uppercase">프로젝트 상태</Label>
                                        <Select value={project.status} onValueChange={v => save({ status: v as ProjectStatus })}>
                                            <SelectTrigger className="h-9 text-sm focus:ring-blue-500">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PROJECT_STATUSES.map(s => <SelectItem key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] text-slate-500 font-bold uppercase">견적 발송일</Label>
                                        <Input
                                            type="date"
                                            className="h-9 text-sm focus:ring-blue-500"
                                            value={project.quote_sent_date ?? ''}
                                            onChange={e => setProject(p => ({ ...p, quote_sent_date: e.target.value }))}
                                            onBlur={e => save({ quote_sent_date: e.target.value || null })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] text-slate-500 font-bold uppercase">프로젝트 마감일</Label>
                                        <Input
                                            type="date"
                                            className="h-9 text-sm focus:ring-blue-500"
                                            value={project.deadline ?? ''}
                                            onChange={e => setProject(p => ({ ...p, deadline: e.target.value }))}
                                            onBlur={e => save({ deadline: e.target.value || null })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[11px] text-slate-500 font-bold uppercase">카테고리</Label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {project.categories?.map(c => (
                                            <Badge key={c} variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-0 text-[11px] px-2.5 py-0.5">
                                                {c}
                                            </Badge>
                                        ))}
                                        {(!project.categories || project.categories.length === 0) && (
                                            <span className="text-xs text-muted-foreground italic">지정된 카테고리가 없습니다.</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[11px] text-slate-500 font-bold uppercase">메모</Label>
                                    </div>
                                    <textarea
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-4 py-3 text-sm resize-none h-32 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        placeholder="특이사항, 담당자 정보, 계약 조건 등 자유롭게 기록하세요."
                                        value={project.memo ?? ''}
                                        onChange={e => setProject(p => ({ ...p, memo: e.target.value }))}
                                        onBlur={e => save({ memo: e.target.value || undefined })}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="settlement" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
                                {incomes.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[11px] text-slate-500 font-bold uppercase">수입 파이프라인 ({incomes.length})</p>
                                        </div>
                                        <div className="grid gap-3">
                                            {incomes.map(income => (
                                                <div key={income.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-semibold">{income.title}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-muted-foreground">{income.expected_date || '일정 미정'}</span>
                                                            <Badge variant="outline" className={cn(
                                                                "text-[10px] px-1.5 py-0",
                                                                PIPELINE_DONE_STATUSES.includes(income.status)
                                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                                    : "bg-orange-50 text-orange-700 border-orange-100"
                                                            )}>
                                                                {income.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-sm font-bold text-slate-900">₩{income.amount.toLocaleString()}</span>
                                                        {income.matched_transaction_id ? (
                                                            <div className="flex items-center gap-1.5 text-emerald-600">
                                                                <Check className="h-4 w-4" />
                                                                <span className="text-xs font-medium">매칭완료</span>
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 text-[11px] text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                onClick={() => setMatchingIncome({ id: income.id, title: income.title, amount: income.amount })}
                                                            >
                                                                <LinkIcon className="h-3.5 w-3.5 mr-1.5" /> 매칭하기
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                        <CreditCard className="h-10 w-10 text-slate-300 mb-3" />
                                        <p className="text-sm text-slate-500 font-medium">등록된 수입 내역이 없습니다.</p>
                                        <p className="text-xs text-slate-400 mt-1">견적서를 생성하면 수입 파이프라인이 생성됩니다.</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-6 p-5 bg-blue-50/30 rounded-2xl border border-blue-100/50">
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] text-blue-600 font-bold uppercase">세금계산서 발행일</Label>
                                        <Input
                                            type="date"
                                            className="h-9 text-sm bg-white border-blue-100 focus:ring-blue-500"
                                            value={project.invoice_sent_date ?? ''}
                                            onChange={e => setProject(p => ({ ...p, invoice_sent_date: e.target.value }))}
                                            onBlur={e => save({ invoice_sent_date: e.target.value || null })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] text-blue-600 font-bold uppercase">입금 예정일</Label>
                                        <Input
                                            type="date"
                                            className="h-9 text-sm bg-white border-blue-100 focus:ring-blue-500"
                                            value={project.expected_payment_date ?? ''}
                                            onChange={e => setProject(p => ({ ...p, expected_payment_date: e.target.value }))}
                                            onBlur={e => save({ expected_payment_date: e.target.value || null })}
                                        />
                                    </div>
                                    
                                    {project.actual_payment_date && (
                                        <div className="col-span-2 pt-4 mt-2 border-t border-blue-100 flex items-center justify-between">
                                            <div>
                                                <Label className="text-[11px] text-emerald-600 font-bold uppercase">실제 입금 완료일</Label>
                                                <div className="text-sm font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                                    {project.actual_payment_date}
                                                </div>
                                            </div>
                                            {project.invoice_sent_date && (
                                                <div className="text-right">
                                                    <Label className="text-[11px] text-slate-500 font-bold uppercase">대금 회수 리드타임</Label>
                                                    <div className="text-sm font-bold text-slate-900 mt-1">
                                                        {(() => {
                                                            const start = new Date(project.invoice_sent_date);
                                                            const end = new Date(project.actual_payment_date!);
                                                            const diff = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                                                            return <span className="text-blue-600">{diff}일</span>;
                                                        })()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="history" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] text-slate-500 font-bold uppercase">체크리스트 {checkProgress && `(${checkProgress.done}/${checkProgress.total})`}</p>
                                        {checkProgress && (
                                            <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${(checkProgress.done / checkProgress.total) * 100}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                                        <div className="space-y-1">
                                            {(project.checklist ?? []).map(item => (
                                                <div key={item.id} className="flex items-center gap-3 py-2 group/item border-b border-white last:border-0">
                                                    <Checkbox
                                                        checked={item.done}
                                                        onCheckedChange={() => toggleTodo(item.id)}
                                                        className="shrink-0 border-slate-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                                    />
                                                    <span className={cn(
                                                        'flex-1 text-sm transition-colors',
                                                        item.done ? 'line-through text-slate-400' : 'text-slate-700'
                                                    )}>{item.text}</span>
                                                    <button
                                                        onClick={() => deleteTodo(item.id)}
                                                        className="opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            {(project.checklist ?? []).length === 0 && (
                                                <div className="py-8 text-center">
                                                    <p className="text-sm text-slate-400 italic">완료된 항목이 없습니다.</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200/50">
                                            <div className="relative flex-1">
                                                <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                                <Input
                                                    className="h-10 text-sm pl-9 bg-white border-slate-200 focus:ring-blue-500"
                                                    placeholder="수행 내용을 입력하고 Enter..."
                                                    value={newTodo}
                                                    onChange={e => setNewTodo(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && addTodo()}
                                                />
                                            </div>
                                            <Button size="sm" className="bg-slate-800 hover:bg-slate-900 h-10 px-4" onClick={addTodo} disabled={!newTodo.trim()}>
                                                저장
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-slate-50/50 flex justify-between items-center sm:justify-between">
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 mr-2" /> 프로젝트 삭제
                    </Button>
                    <div className="flex items-center gap-3">
                        {isSaving && (
                            <div className="flex items-center gap-1.5 text-blue-600 animate-pulse">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                <span className="text-xs font-medium">자동 저장 중</span>
                            </div>
                        )}
                        <Button variant="outline" onClick={onClose} className="h-9 px-6 text-xs font-semibold">닫기</Button>
                    </div>
                </DialogFooter>
            </DialogContent>

            {/* Match Income Dialog */}
            {matchingIncome && (
                <MatchIncomeDialog
                    isOpen={!!matchingIncome}
                    onClose={() => {
                        setMatchingIncome(null)
                        onUpdated({ ...project }) // Trigger parent reload
                    }}
                    incomeId={matchingIncome.id}
                    amount={matchingIncome.amount}
                    title={matchingIncome.title}
                />
            )}
        </Dialog>
    )
}
