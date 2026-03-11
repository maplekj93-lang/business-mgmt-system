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
import { Plus, Edit2, Trash2, Briefcase, User } from 'lucide-react'

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
  // 소프트웨어 / IT / 클라우드
  'adobe', 'aws', 'google', 'workspace', 'github', 'vercel', 'notion', 'slack', 'figma', 'framer',
  'chatgpt', 'openai', 'claude', 'anthropic', 'midjourney', 'microsoft', 'office', 'vultr', 'digitalocean',
  // 비즈니스 / 결제 / 회계
  'toss', 'portone', 'stripe', 'zoom', 'cdn', 'domain', 'hosting', 'server',
  '아마존', '구글', '노션', '슬랙', '마이크로소프트', '퍼플렉시티', 'perplexity', '쿠팡 비즈',
];

function isBusinessKeywordMatch(name: string): boolean {
  if (!name) return false;
  const lowerName = name.toLowerCase();
  return BUSINESS_KEYWORDS.some(keyword => lowerName.includes(keyword.toLowerCase()));
}

export default function RecurringExpensesPage() {
  const [expenses, setExpenses] = useState<RecurringExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(DEFAULT_FORM)
  const [isRecording, setIsRecording] = useState(false)

  // Load data on mount
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
      if (result.errors) {
        result.errors.forEach((err: string) => toast.error(err))
      }
    } catch (error) {
      toast.error('기록 실패')
    } finally {
      setIsRecording(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'paused':
        return 'bg-amber-100 text-amber-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return '활성'
      case 'inactive':
        return '비활성'
      case 'paused':
        return '일시정지'
      default:
        return status
    }
  }

  if (loading) {
    return <div className="p-6">로딩 중...</div>
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">구독 및 고정비 관리</h1>
          <p className="text-gray-600 mt-1">매달 자동으로 기록될 고정 지출을 관리합니다</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRecordNow}
            disabled={isRecording || expenses.filter((e) => e.status === 'active').length === 0}
            variant="outline"
          >
            {isRecording ? '기록 중...' : '지금 기록하기'}
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <Button asChild>
              <div onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                새 구독 추가
              </div>
            </Button>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingId ? '구독 수정' : '새 구독 추가'}</DialogTitle>
                <DialogDescription>매달 자동으로 기록될 구독 정보를 입력하세요</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">이름 *</Label>
                  <Input
                    id="name"
                    placeholder="예: Adobe Creative Cloud"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const newName = e.target.value;
                      setFormData((prev) => {
                        // 만약 신규 추가 모드이고, 현재 name에서 비즈니스 키워드가 감지되면 is_business를 true로 제안
                        const shouldBeBusiness = !editingId && isBusinessKeywordMatch(newName);
                        return {
                          ...prev,
                          name: newName,
                          ...(shouldBeBusiness && !prev.is_business ? { is_business: true } : {})
                        };
                      });
                    }}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">설명 (선택)</Label>
                  <Input
                    id="description"
                    placeholder="예: 월간 구독료"
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">금액 *</Label>
                  <div className="flex items-center">
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0"
                      value={formData.amount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                      }
                      className="flex-1"
                    />
                    <span className="ml-2 text-gray-600">원</span>
                  </div>
                </div>

                {/* Frequency */}
                <div className="space-y-2">
                  <Label htmlFor="frequency">빈도</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value: string) =>
                      setFormData((prev) => ({ ...prev, frequency: value as FrequencyType }))
                    }
                  >
                    <SelectTrigger id="frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((freq) => (
                        <SelectItem key={freq} value={freq}>
                          {freq === 'monthly' ? '월간' : freq === 'quarterly' ? '분기' : '연간'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Due Day */}
                <div className="space-y-2">
                  <Label htmlFor="due_day">납기일 (매월)</Label>
                  <Input
                    id="due_day"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.due_day_of_month}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev) => ({ ...prev, due_day_of_month: parseInt(e.target.value) }))
                    }
                  />
                </div>

                {/* Owner Type */}
                <div className="space-y-2">
                  <Label htmlFor="owner">소유자</Label>
                  <Select
                    value={formData.owner_type}
                    onValueChange={(value: string) =>
                      setFormData((prev) => ({ ...prev, owner_type: value }))
                    }
                  >
                    <SelectTrigger id="owner">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OWNER_TYPES.map((owner) => (
                        <SelectItem key={owner} value={owner}>
                          {owner === 'kwangjun' ? '광준' : owner === 'euiyoung' ? '의영' : '공동'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Business Toggle */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_business"
                    checked={formData.is_business}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev) => ({ ...prev, is_business: e.target.checked }))
                    }
                    className="w-4 h-4"
                  />
                  <Label htmlFor="is_business">사업 관련 지출</Label>
                </div>

                {/* Auto Record Toggle */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_auto_record"
                    checked={formData.is_auto_record}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev) => ({ ...prev, is_auto_record: e.target.checked }))
                    }
                    className="w-4 h-4"
                  />
                  <div className="flex flex-col">
                    <Label htmlFor="is_auto_record">가계부에 자동 기록 (정기 구독)</Label>
                    <span className="text-xs text-slate-500">체크 해제 시 캘린더에만 표기된 후 수동으로 결제해야 합니다. (유동 결제)</span>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">상태</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: string) =>
                      setFormData((prev) => ({ ...prev, status: value as RecurringStatus }))
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">활성</SelectItem>
                      <SelectItem value="inactive">비활성</SelectItem>
                      <SelectItem value="paused">일시정지</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleSave}>저장</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      {!loading && expenses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-muted-foreground">총 정기 지출</p>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold">
                  {expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">원 / 월</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-indigo-500/5 border-indigo-500/20">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-indigo-600 flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  사업 정기 지출
                </p>
                <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-600 border-0 pointer-events-none">
                  부가세 공제 가능
                </Badge>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-indigo-700">
                  {expenses.filter(e => e.is_business).reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                </span>
                <span className="text-sm text-indigo-500/70">원 / 월</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-slate-600 flex items-center gap-1">
                  <User className="w-4 h-4" />
                  개인 정기 지출
                </p>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-slate-700">
                  {expenses.filter(e => !e.is_business).reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                </span>
                <span className="text-sm text-slate-500/70">원 / 월</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <Card>
          <CardContent className="pt-8 text-center text-muted-foreground">등록된 구독이 없습니다.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {expenses.map((expense) => (
            <Card 
              key={expense.id} 
              className={`hover:shadow-md transition-shadow relative overflow-hidden ${
                expense.is_business ? 'border-l-4 border-l-indigo-500 bg-indigo-50/30' : 'border-l-4 border-l-slate-300'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                        {expense.name}
                        {expense.is_business && (
                          <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 text-xs py-0.5">
                            <Briefcase className="w-3 h-3 mr-1" /> 사업비
                          </Badge>
                        )}
                        {expense.is_auto_record === false && (
                          <Badge variant="outline" className="text-amber-600 bg-amber-50 text-xs py-0.5">수동 결제</Badge>
                        )}
                    </CardTitle>
                    {expense.description && (
                      <CardDescription className="mt-1">{expense.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(expense.id, expense.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Amount and Frequency */}
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-2xl font-bold">{expense.amount.toLocaleString()}</span>
                    <span className="text-gray-600 ml-2">
                      /
                      {expense.frequency === 'monthly'
                        ? '월'
                        : expense.frequency === 'quarterly'
                          ? '분기'
                          : '년'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">다음 기한</p>
                    <p className="text-lg font-semibold">{expense.next_due_date}</p>
                  </div>
                </div>

                {/* Details Row */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">소유자:</span>
                    <p className="font-medium">
                      {expense.owner_type === 'kwangjun'
                        ? '광준'
                        : expense.owner_type === 'euiyoung'
                          ? '의영'
                          : '공동'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">마지막 기록:</span>
                    <p className="font-medium">{expense.last_recorded_date || '아직 없음'}</p>
                  </div>
                  <div className="flex items-center justify-between col-span-2">
                    <span className="text-gray-600">상태:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(expense.id, expense.status)}
                    >
                      <Badge className={getStatusColor(expense.status)}>
                        {getStatusLabel(expense.status)}
                      </Badge>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
