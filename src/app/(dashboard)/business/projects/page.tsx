"use client"

import { useState, useEffect, useCallback } from 'react'
import { Plus, FolderOpen, Check, Circle, Trash2, ChevronDown, ChevronUp, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Checkbox } from '@/shared/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { getProjects } from '@/entities/project/api/get-projects'
import { createProject } from '@/entities/project/api/create-project'
import { updateProject } from '@/entities/project/api/update-project'
import { deleteProject } from '@/entities/project/api/delete-project'
import { ClientSelect } from '@/entities/client/ui/ClientSelect'
import { BackButton } from '@/shared/ui/back-button'
import {
    OWNER_TYPES, OWNER_LABELS, OWNER_COLORS,
    INCOME_TYPES, INCOME_TYPE_LABELS,
    PROJECT_CATEGORIES,
    PROJECT_STATUSES, PROJECT_STATUS_LABELS,
    PIPELINE_STATUSES,
    type OwnerType, type ProjectStatus,
} from '@/shared/constants/business'
import type { Project, ChecklistItem } from '@/entities/project/model/types'
import { cn } from '@/shared/lib/utils'
import { CreateQuoteDialog } from '@/features/create-quote/ui/CreateQuoteDialog'
import { MatchIncomeDialog } from '@/features/match-income/ui/MatchIncomeDialog'
import { getBusinessProfiles } from '@/features/manage-business-profile/api/business-profile-api'

// ─── 상수 ────────────────────────────────────────────────────
const STATUS_COLORS: Record<ProjectStatus, string> = {
    active: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
    on_hold: 'bg-amber-100 text-amber-700 border-amber-200',
}

const PIPELINE_DONE_STATUSES = ['입금완료', '포스팅완료']

// ─── 유틸 ────────────────────────────────────────────────────
function checklistProgress(items: ChecklistItem[]) {
    if (!items?.length) return null
    return { done: items.filter(i => i.done).length, total: items.length }
}

function latestPipelineStatus(project: Project) {
    const incomes = project.project_incomes ?? []
    if (!incomes.length) return null
    // 가장 최근(완료 안된 것 우선)
    const active = incomes.find(i => !PIPELINE_DONE_STATUSES.includes(i.status))
    return active?.status ?? incomes[incomes.length - 1]?.status ?? null
}

// ─── 프로젝트 카드 ───────────────────────────────────────────
function ProjectCard({ project, onSelect }: { project: Project; onSelect: () => void }) {
    const progress = checklistProgress(project.checklist)
    const pipelineStatus = latestPipelineStatus(project)
    const ownerColor = OWNER_COLORS[project.business_owner] ?? 'bg-gray-400'

    return (
        <div
            onClick={onSelect}
            className="bg-white rounded-xl p-4 hover:shadow-md hover:border-blue-200 cursor-pointer transition-all space-y-3 group"
        >
            {/* 헤더: 오너 색상 바 + 이름 */}
            <div className="flex items-start gap-3">
                <div className={cn('w-1 self-stretch rounded-full flex-shrink-0', ownerColor)} />
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight truncate group-hover:text-blue-700">{project.name}</p>
                    {project.client?.name && (
                        <p className="text-xs text-muted-foreground mt-0.5">{project.client.name}</p>
                    )}
                </div>
                <Badge className={cn('text-[10px] px-1.5 shrink-0 border', STATUS_COLORS[project.status])}>
                    {PROJECT_STATUS_LABELS[project.status]}
                </Badge>
            </div>

            {/* 카테고리 태그 */}
            {project.categories?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {project.categories.slice(0, 3).map(c => (
                        <span key={c} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{c}</span>
                    ))}
                    {project.categories.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{project.categories.length - 3}</span>
                    )}
                </div>
            )}

            {/* 하단: 파이프라인 + 체크리스트 */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    {pipelineStatus && (
                        <span className={cn(
                            'px-1.5 py-0.5 rounded text-[10px] font-medium',
                            PIPELINE_DONE_STATUSES.includes(pipelineStatus)
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-orange-50 text-orange-700'
                        )}>{pipelineStatus}</span>
                    )}
                    <span className="text-[10px] text-slate-400">
                        {OWNER_LABELS[project.business_owner]}
                    </span>
                </div>
                {progress && (
                    <span className={cn(
                        'text-[10px] font-medium',
                        progress.done === progress.total ? 'text-emerald-600' : 'text-muted-foreground'
                    )}>
                        {progress.done === progress.total ? '✓' : ''} {progress.done}/{progress.total} 완료
                    </span>
                )}
            </div>
        </div>
    )
}

// ─── 프로젝트 생성 모달 ──────────────────────────────────────
function CreateProjectModal({ open, onClose, onCreated }: {
    open: boolean; onClose: () => void; onCreated: (p: Project) => void
}) {
    const [name, setName] = useState('')
    const [clientId, setClientId] = useState('')
    const [owner, setOwner] = useState<OwnerType>('kwangjun')
    const [incomeType, setIncomeType] = useState('freelance')
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [startDate, setStartDate] = useState('')
    const [deadline, setDeadline] = useState('')
    const [memo, setMemo] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    function reset() {
        setName(''); setClientId(''); setOwner('kwangjun'); setIncomeType('freelance')
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

// ─── 프로젝트 상세 모달 ──────────────────────────────────────
function ProjectDetailModal({ project: initial, profiles, open, onClose, onUpdated, onDeleted }: {
    project: Project; profiles: any[]; open: boolean; onClose: () => void
    onUpdated: (p: Project) => void; onDeleted: (id: string) => void
}) {
    // Find the profile matching the project owner
    const activeProfile = profiles.find(p => p.owner_type === initial.business_owner) || profiles[0];
    const [project, setProject] = useState(initial)
    const [newTodo, setNewTodo] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [showMemo, setShowMemo] = useState(!!initial.memo)
    const [matchingIncome, setMatchingIncome] = useState<{ id: string; title: string; amount: number } | null>(null)

    useEffect(() => { setProject(initial); setShowMemo(!!initial.memo) }, [initial])

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

    const progress = checklistProgress(project.checklist)
    const incomes = project.project_incomes ?? []

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between pr-6">
                        <div className="flex items-center gap-2 flex-1">
                            <div className={cn('w-2 h-6 rounded-full flex-shrink-0', OWNER_COLORS[project.business_owner])} />
                            <input
                                className="flex-1 text-lg font-bold bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-400 focus:outline-none transition-colors py-0.5"
                                value={project.name}
                                onChange={e => setProject(p => ({ ...p, name: e.target.value }))}
                                onBlur={e => save({ name: e.target.value.trim() || project.name })}
                            />
                        </div>
                        {activeProfile && (
                            <div className="flex-shrink-0 ml-4">
                                <CreateQuoteDialog project={project} profile={activeProfile} />
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <div className="space-y-5 pt-1">
                    {/* 기본 정보 */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="grid gap-1">
                            <Label className="text-xs">담당자</Label>
                            <Select value={project.business_owner} onValueChange={v => save({ business_owner: v as OwnerType })}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {OWNER_TYPES.map(o => <SelectItem key={o} value={o}>{OWNER_LABELS[o]}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-xs">상태</Label>
                            <Select value={project.status} onValueChange={v => save({ status: v as ProjectStatus })}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {PROJECT_STATUSES.map(s => <SelectItem key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-xs">마감일</Label>
                            <Input
                                type="date"
                                className="h-8 text-xs"
                                value={project.deadline ?? ''}
                                onChange={e => setProject(p => ({ ...p, deadline: e.target.value }))}
                                onBlur={e => save({ deadline: e.target.value || undefined })}
                            />
                        </div>
                    </div>

                    {/* 카테고리 */}
                    {project.categories?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {project.categories.map(c => (
                                <span key={c} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{c}</span>
                            ))}
                        </div>
                    )}

                    {/* 수입 파이프라인 */}
                    {incomes.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">수입 파이프라인</p>
                            <div className="space-y-1.5">
                                {incomes.map(income => (
                                    <div key={income.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                                        <div>
                                            <span className="font-medium">{income.title}</span>
                                            {income.expected_date && (
                                                <span className="text-xs text-muted-foreground ml-2">{income.expected_date}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold">₩{income.amount.toLocaleString()}</span>
                                            {income.matched_transaction_id ? (
                                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-0 flex items-center gap-1">
                                                    <Check className="h-3 w-3" /> 매칭완료
                                                </Badge>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 text-[10px] text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                                    onClick={() => setMatchingIncome({ id: income.id, title: income.title, amount: income.amount })}
                                                >
                                                    <LinkIcon className="h-3 w-3 mr-1" /> 매칭하기
                                                </Button>
                                            )}
                                            <span className={cn(
                                                'text-[10px] px-1.5 py-0.5 rounded font-medium',
                                                PIPELINE_DONE_STATUSES.includes(income.status)
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-orange-100 text-orange-700'
                                            )}>{income.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Match Income Dialog */}
                    {matchingIncome && (
                        <MatchIncomeDialog
                            isOpen={!!matchingIncome}
                            onClose={() => {
                                setMatchingIncome(null)
                                // We don't need explicit refresh here as the server action revalidates, 
                                // but we might want to reload local state if needed.
                                onUpdated({ ...project }) // Trigger parent reload
                            }}
                            incomeId={matchingIncome.id}
                            amount={matchingIncome.amount}
                            title={matchingIncome.title}
                        />
                    )}

                    {/* 입금 일정 / 리드타임 */}
                    <div className="space-y-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                             📅 입금 일정 및 리드타임
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label className="text-[11px] text-slate-500 font-bold">세금계산서 발행일</Label>
                                <Input
                                    type="date"
                                    className="h-9 text-xs bg-white"
                                    value={project.invoice_sent_date ?? ''}
                                    onChange={e => setProject(p => ({ ...p, invoice_sent_date: e.target.value }))}
                                    onBlur={e => save({ invoice_sent_date: e.target.value || null })}
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label className="text-[11px] text-slate-500 font-bold">입금 예정일</Label>
                                <Input
                                    type="date"
                                    className="h-9 text-xs bg-white"
                                    value={project.expected_payment_date ?? ''}
                                    onChange={e => setProject(p => ({ ...p, expected_payment_date: e.target.value }))}
                                    onBlur={e => save({ expected_payment_date: e.target.value || null })}
                                />
                            </div>
                        </div>

                        {project.actual_payment_date && (
                            <div className="pt-2 mt-2 border-t border-slate-200/60 grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-[11px] text-emerald-600 font-bold">실제 입금일</Label>
                                    <div className="text-sm font-bold text-emerald-700 mt-1 flex items-center gap-1">
                                        <Check className="h-4 w-4" /> {project.actual_payment_date}
                                    </div>
                                </div>
                                {project.invoice_sent_date && (
                                    <div>
                                        <Label className="text-[11px] text-blue-600 font-bold">회수 소요일 (리드타임)</Label>
                                        <div className="text-sm font-bold text-blue-700 mt-1">
                                            {(() => {
                                                const start = new Date(project.invoice_sent_date);
                                                const end = new Date(project.actual_payment_date);
                                                const diff = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                                                return `${diff}일`;
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 체크리스트 */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                할 일 {progress && `(${progress.done}/${progress.total})`}
                            </p>
                            {progress && (
                                <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all"
                                        style={{ width: `${(progress.done / progress.total) * 100}%` }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            {(project.checklist ?? []).map(item => (
                                <div key={item.id} className="flex items-center gap-2 group/item">
                                    <Checkbox
                                        checked={item.done}
                                        onCheckedChange={() => toggleTodo(item.id)}
                                        className="shrink-0"
                                    />
                                    <span className={cn(
                                        'flex-1 text-sm',
                                        item.done && 'line-through text-muted-foreground'
                                    )}>{item.text}</span>
                                    <button
                                        onClick={() => deleteTodo(item.id)}
                                        className="opacity-0 group-hover/item:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2 mt-2">
                            <Input
                                className="h-8 text-sm"
                                placeholder="할 일 추가..."
                                value={newTodo}
                                onChange={e => setNewTodo(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addTodo()}
                            />
                            <Button size="sm" variant="outline" onClick={addTodo} disabled={!newTodo.trim()}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* 메모 */}
                    <div className="space-y-2">
                        <button
                            className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1 hover:text-foreground transition-colors"
                            onClick={() => setShowMemo(v => !v)}
                        >
                            메모 {showMemo ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                        {showMemo && (
                            <textarea
                                className="w-full rounded-md border-input bg-background px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="특이사항, 담당자 정보, 계약 조건 등..."
                                value={project.memo ?? ''}
                                onChange={e => setProject(p => ({ ...p, memo: e.target.value }))}
                                onBlur={e => save({ memo: e.target.value || undefined })}
                            />
                        )}
                    </div>
                </div>

                <DialogFooter className="mt-4 flex justify-between">
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 mr-1" /> 삭제
                    </Button>
                    <div className="flex items-center gap-2">
                        {isSaving && <span className="text-xs text-muted-foreground">저장 중...</span>}
                        <Button variant="outline" onClick={onClose}>닫기</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─── 메인 페이지 ─────────────────────────────────────────────
type OwnerFilter = OwnerType | 'all'

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [profiles, setProfiles] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all')
    const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('active')
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [selectedProject, setSelectedProject] = useState<Project | null>(null)

    const load = useCallback(async () => {
        setIsLoading(true)
        try {
            const [data, profileData] = await Promise.all([
                getProjects(),
                getBusinessProfiles()
            ])
            setProjects(data)
            setProfiles(profileData)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const filtered = projects.filter(p => {
        if (ownerFilter !== 'all' && p.business_owner !== ownerFilter) return false
        if (statusFilter !== 'all' && p.status !== statusFilter) return false
        return true
    })

    function handleCreated(project: Project) {
        setProjects(prev => [project, ...prev])
    }

    function handleUpdated(updated: Project) {
        setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
        if (selectedProject?.id === updated.id) setSelectedProject(updated)
    }

    function handleDeleted(id: string) {
        setProjects(prev => prev.filter(p => p.id !== id))
        setSelectedProject(null)
    }

    const ownerCounts = (OWNER_TYPES as readonly OwnerFilter[]).reduce((acc, o) => {
        acc[o] = projects.filter(p => p.business_owner === o).length
        return acc
    }, {} as Record<OwnerFilter, number>)

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BackButton label="비즈니스" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <FolderOpen className="h-6 w-6 text-blue-500" /> 프로젝트 센터
                        </h1>
                        <p className="text-sm text-muted-foreground">총 {projects.length}개 프로젝트</p>
                    </div>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" /> 새 프로젝트
                </Button>
            </div>

            {/* 필터 */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* 오너 탭 */}
                <Tabs value={ownerFilter} onValueChange={v => setOwnerFilter(v as OwnerFilter)}>
                    <TabsList className="h-9">
                        <TabsTrigger value="all" className="text-xs px-3">
                            전체 <span className="ml-1 text-muted-foreground">{projects.length}</span>
                        </TabsTrigger>
                        {OWNER_TYPES.map(o => (
                            <TabsTrigger key={o} value={o} className="text-xs px-3">
                                {OWNER_LABELS[o]}
                                {ownerCounts[o] > 0 && (
                                    <span className="ml-1 text-muted-foreground">{ownerCounts[o]}</span>
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                {/* 상태 필터 */}
                <div className="flex gap-1.5">
                    {(['all', ...PROJECT_STATUSES] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                'text-xs px-3 py-1.5 rounded-full  transition-colors',
                                statusFilter === s
                                    ? 'bg-slate-800 text-white border-slate-800'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                            )}
                        >
                            {s === 'all' ? '전체' : PROJECT_STATUS_LABELS[s]}
                        </button>
                    ))}
                </div>
            </div>

            {/* 카드 그리드 */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-32 bg-muted/40 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                    <FolderOpen className="h-12 w-12 opacity-20" />
                    <p className="text-sm">해당 조건의 프로젝트가 없습니다.</p>
                    <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(true)}>
                        <Plus className="mr-1.5 h-4 w-4" /> 첫 프로젝트 만들기
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(project => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onSelect={() => setSelectedProject(project)}
                        />
                    ))}
                </div>
            )}

            {/* 모달들 */}
            <CreateProjectModal
                open={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onCreated={handleCreated}
            />

            {selectedProject && (
                <ProjectDetailModal
                    key={selectedProject.id}
                    project={selectedProject}
                    profiles={profiles}
                    open={!!selectedProject}
                    onClose={() => setSelectedProject(null)}
                    onUpdated={handleUpdated}
                    onDeleted={handleDeleted}
                />
            )}
        </div>
    )
}
