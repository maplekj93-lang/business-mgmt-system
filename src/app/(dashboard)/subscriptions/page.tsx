'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Badge } from '@/shared/ui/badge'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, Briefcase, User, Calendar } from 'lucide-react'

import {
  getAllRecurringExpenses,
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  toggleRecurringStatus,
} from '@/entities/recurring-expense/api/recurring-expense-api'
import { recordPendingRecurringExpenses } from '@/features/record-recurring-expense/api/record-recurring'

import type { RecurringExpense, CreateRecurringExpenseInput, FrequencyType, RecurringStatus } from '@/entities/recurring-expense/model/types'
import { FREQUENCIES, OWNER_TYPES } from '@/entities/recurring-expense/model/types'

const DEFAULT_FORM: {
  name: string
  description: string
  amount: number
  frequency: FrequencyType
  due_day_of_month: number
  category_id: number | undefined
  owner_type: string
  is_business: boolean
  is_auto_record: boolean
  status: RecurringStatus
} = {
  name: '',
  description: '',
  amount: 0,
  frequency: 'monthly' as FrequencyType,
  due_day_of_month: 1,
  category_id: undefined,
  owner_type: 'joint',
  is_business: true,
  is_auto_record: true,
  status: 'active' as RecurringStatus,
}

const BUSINESS_KEYWORDS = [
  'adobe', 'aws', 'google', 'workspace', 'github', 'vercel', 'notion', 'slack', 'figma', 'framer',
  'chatgpt', 'openai', 'claude', 'anthropic', 'midjourney', 'microsoft', 'office', 'vultr', 'digitalocean',
  'toss', 'portone', 'stripe', 'zoom', 'cdn', 'domain', 'hosting', 'server',
  '아마존', '구글', '노션', '슬랙', '마이크로소프트', '퍼플렉시티', 'perplexity', '쿠팡 비즈',
];

function isBusinessKeywordMatch(name: string): boolean {
  if (!name) return false;
  const lowerName = name.toLowerCase();
  return BUSINESS_KEYWORDS.some(keyword => lowerName.includes(keyword.toLowerCase()));
}

export default function SubscriptionsPage() {
  const [expenses, setExpenses] = useState<RecurringExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(DEFAULT_FORM)
  const [isRecording, setIsRecording] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const expensesData = await getAllRecurringExpenses()
      setExpenses(expensesData)
    } catch (error) {
      toast.error('데이터 로드 실패')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = useCallback(() => {
    setFormData(DEFAULT_FORM)
    setEditingId(null)
  }, [])

  const handleEdit = useCallback((expense: RecurringExpense) => {
    setFormData({
      name: expense.name,
      description: expense.description || '',
      amount: expense.amount,
      frequency: expense.frequency as FrequencyType,
      due_day_of_month: expense.due_day_of_month,
      category_id: expense.category_id ?? undefined,
      owner_type: expense.owner_type || 'joint',
      is_business: expense.is_business,
      is_auto_record: expense.is_auto_record ?? true,
      status: expense.status as RecurringStatus,
    })
    setEditingId(expense.id)
    setIsCreateOpen(true)
  }, [])

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('이름은 필수입니다')
      return
    }

    if (formData.amount <= 0) {
      toast.error('금액은 0보다 커야 합니다')
      return
    }

    try {
      const input: CreateRecurringExpenseInput = {
        name: formData.name,
        description: formData.description || undefined,
        amount: formData.amount,
        frequency: formData.frequency,
        due_day_of_month: formData.due_day_of_month,
        category_id: formData.category_id,
        owner_type: formData.owner_type,
        is_business: formData.is_business,
        is_auto_record: formData.is_auto_record,
        status: formData.status,
      }

      if (editingId) {
        await updateRecurringExpense(editingId, input)
        toast.success('수정되었습니다')
      } else {
        await createRecurringExpense(input)
        toast.success('추가되었습니다')
      }

      resetForm()
      setIsCreateOpen(false)
      await loadData()
    } catch (error) {
      toast.error('저장 실패')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`"${name}"을(를) 정말 삭제하시겠습니까?`)) {
      try {
        await deleteRecurringExpense(id)
        toast.success('삭제되었습니다')
        await loadData()
      } catch (error) {
        toast.error('삭제 실패')
      }
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      await toggleRecurringStatus(id, newStatus as RecurringStatus)
      toast.success('상태가 변경되었습니다')
      await loadData()
    } catch (error) {
      toast.error('상태 변경 실패')
    }
  }

  const handleRecordNow = async () => {
    try {
      setIsRecording(true)
      const result = await recordPendingRecurringExpenses()
      if (result.recorded > 0) {
        toast.success(result.message)
        await loadData()
      } else {
        toast.info(result.message)
      }
    } catch (error) {
      toast.error('기록 실패')
    } finally {
      setIsRecording(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'paused': return 'bg-amber-100 text-amber-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '활성'
      case 'inactive': return '비활성'
      case 'paused': return '일시정지'
      default: return status
    }
  }

  if (loading) {
    return <div className="p-6">로딩 중...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tight text-foreground">구독 및 고정비 관리</h1>
          <p className="text-sm text-muted-foreground font-medium">매달 자동으로 기록될 정기 지출 및 구독 서비스를 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRecordNow}
            disabled={isRecording || expenses.filter((e) => e.status === 'active').length === 0}
            variant="outline"
            className="tactile-button"
          >
            {isRecording ? '기록 중...' : '지금 기록하기'}
          </Button>
          <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="tactile-button bg-foreground text-background hover:bg-foreground/90">
            <Plus className="h-4 w-4 mr-2" />
            새 구독 추가
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="tactile-panel bg-white/50 border-border/50">
          <CardContent className="pt-6">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">총 정기 지출</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black">{expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</span>
              <span className="text-sm font-bold text-muted-foreground">원 / 월</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="tactile-panel bg-indigo-500/[0.03] border-indigo-500/10">
          <CardContent className="pt-6">
            <p className="text-xs font-bold text-indigo-600/70 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> 사업 관련
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-indigo-700">{expenses.filter(e => e.is_business).reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</span>
              <span className="text-sm font-bold text-indigo-500/70">원 / 월</span>
            </div>
          </CardContent>
        </Card>

        <Card className="tactile-panel bg-emerald-500/[0.03] border-emerald-500/10">
          <CardContent className="pt-6">
            <p className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider mb-1 flex items-center gap-1">
              <User className="w-3 h-3" /> 개인/공동
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-700">{expenses.filter(e => !e.is_business).reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</span>
              <span className="text-sm font-bold text-emerald-500/70">원 / 월</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {expenses.length === 0 ? (
          <div className="col-span-2 tactile-panel p-12 text-center text-muted-foreground">
            등록된 구독 정보가 없습니다. 버튼을 눌러 새 구독을 추가해보세요.
          </div>
        ) : (
          expenses.map((expense) => (
            <div 
              key={expense.id} 
              className={`tactile-panel p-5 transition-all hover:translate-y-[-2px] hover:shadow-lg ${
                expense.is_business ? 'bg-indigo-500/[0.02] border-indigo-500/10' : 'bg-white/50 border-border/50'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-lg text-foreground">{expense.name}</h3>
                    {expense.is_business && (
                      <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 text-[10px] font-black px-1.5 h-4">BUSINESS</Badge>
                    )}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">{expense.description || '정기 결제 서비스'}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleEdit(expense)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive" onClick={() => handleDelete(expense.id, expense.name)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-foreground">{expense.amount.toLocaleString()}</span>
                    <span className="text-xs font-bold text-muted-foreground">원 / {expense.frequency === 'monthly' ? '월' : expense.frequency === 'quarterly' ? '분기' : '년'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-0.5">
                      <Calendar className="w-2.5 h-2.5" /> 매월 {expense.due_day_of_month}일
                    </span>
                    <Badge variant="outline" className={`text-[10px] font-bold ${getStatusColor(expense.status)} border-0`}>
                      {getStatusLabel(expense.status)}
                    </Badge>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">다음 결제일</p>
                  <p className="text-xs font-black text-foreground">{expense.next_due_date}</p>
                </div>
              </div>
            </div>
          )
        ))}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-black">{editingId ? '구독 정보 수정' : '새로운 구독 추가'}</DialogTitle>
            <DialogDescription className="font-medium text-xs">매달 정기적으로 발생하는 지출 정보를 입력합니다.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold">이름 *</Label>
                <Input
                  id="name"
                  placeholder="Adobe, Netflix 등"
                  value={formData.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      name: newName,
                      is_business: !editingId && isBusinessKeywordMatch(newName) ? true : prev.is_business
                    }));
                  }}
                  className="tactile-input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-xs font-bold">금액 *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="tactile-input"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-bold">설명</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="tactile-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="frequency" className="text-xs font-bold">결제 주기</Label>
                <Select value={formData.frequency} onValueChange={(val: FrequencyType) => setFormData(prev => ({ ...prev, frequency: val }))}>
                  <SelectTrigger className="tactile-input"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">매월</SelectItem>
                    <SelectItem value="quarterly">매분기</SelectItem>
                    <SelectItem value="yearly">매년</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="due_day" className="text-xs font-bold">결제일 (매월)</Label>
                <Input
                  id="due_day"
                  type="number"
                  min="1" max="31"
                  value={formData.due_day_of_month}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_day_of_month: parseInt(e.target.value) || 1 }))}
                  className="tactile-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="owner" className="text-xs font-bold">소유자</Label>
                <Select value={formData.owner_type} onValueChange={(val) => setFormData(prev => ({ ...prev, owner_type: val }))}>
                  <SelectTrigger className="tactile-input"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kwangjun">광준</SelectItem>
                    <SelectItem value="euiyoung">의영</SelectItem>
                    <SelectItem value="joint">공동</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-bold">상태</Label>
                <Select value={formData.status} onValueChange={(val: RecurringStatus) => setFormData(prev => ({ ...prev, status: val }))}>
                  <SelectTrigger className="tactile-input"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">활성</SelectItem>
                    <SelectItem value="inactive">비활성</SelectItem>
                    <SelectItem value="paused">일시정지</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_business"
                  checked={formData.is_business}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_business: e.target.checked }))}
                  className="w-4 h-4 rounded border-border text-foreground focus:ring-foreground"
                />
                <Label htmlFor="is_business" className="text-xs font-bold cursor-pointer">사업비 처리</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_auto_record"
                  checked={formData.is_auto_record}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_auto_record: e.target.checked }))}
                  className="w-4 h-4 rounded border-border text-foreground focus:ring-foreground"
                />
                <Label htmlFor="is_auto_record" className="text-xs font-bold cursor-pointer">자동 기록</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" className="font-bold text-xs" onClick={() => setIsCreateOpen(false)}>취소</Button>
            <Button className="bg-foreground text-background hover:bg-foreground/90 font-black text-xs px-8" onClick={handleSave}>
              저장하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
