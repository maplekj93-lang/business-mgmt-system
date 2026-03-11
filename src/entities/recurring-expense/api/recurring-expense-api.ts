'use server'

import { createClient } from '@/shared/api/supabase/server'
import {
  RecurringExpense,
  RecurringExpenseSummary,
  CreateRecurringExpenseInput,
  UpdateRecurringExpenseInput,
} from '../model/types'

/**
 * 현재 월의 YYYY-MM 형식 반환
 */
function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * 다음 기한 날짜 계산 (빈도에 따라)
 */
function calculateNextDueDate(
  frequency: 'monthly' | 'quarterly' | 'annual',
  dueDay: number
): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  let nextDate: Date

  switch (frequency) {
    case 'monthly':
      nextDate = new Date(year, month + 1, dueDay)
      break
    case 'quarterly':
      nextDate = new Date(year, month + 3, dueDay)
      break
    case 'annual':
      nextDate = new Date(year + 1, month, dueDay)
      break
  }

  // 월의 마지막 날이 due_day보다 작으면 조정
  if (nextDate.getDate() !== dueDay) {
    nextDate.setDate(0) // 이전 월의 마지막 날
  }

  return nextDate.toISOString().split('T')[0] // YYYY-MM-DD
}

/**
 * 모든 활성 구독 조회
 */
export async function getActiveRecurringExpenses(): Promise<RecurringExpense[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data } = await supabase.from('recurring_expenses')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('name')

  return (data as RecurringExpense[]) || []
}

/**
 * 구독 ID로 조회
 */
export async function getRecurringExpenseById(id: string): Promise<RecurringExpense | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase.from('recurring_expenses')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  return data as RecurringExpense | null
}

/**
 * 소유자별 구독 조회
 */
export async function getRecurringExpensesByOwner(
  ownerType: string
): Promise<RecurringExpense[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data } = await supabase.from('recurring_expenses')
    .select('*')
    .eq('user_id', user.id)
    .eq('owner_type', ownerType)
    .eq('status', 'active')
    .order('name')

  return (data as RecurringExpense[]) || []
}

/**
 * 이번 달에 기한이 된 구독 조회
 */
export async function getDueThisMonth(): Promise<RecurringExpense[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const today = new Date()
  const dateStr = today.toISOString().split('T')[0]

  const { data } = await supabase.from('recurring_expenses')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .eq('is_auto_record', true)
    .lte('next_due_date', dateStr)
    .order('due_day_of_month')

  return (data as RecurringExpense[]) || []
}

/**
 * 월별 요약 조회 (월별 소계)
 */
export async function getMonthlyRecurringSummary(
  yearMonth: string
): Promise<RecurringExpenseSummary | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const startDate = `${yearMonth}-01`
  const endDate = new Date(parseInt(yearMonth.split('-')[0]), parseInt(yearMonth.split('-')[1]), 0)
    .toISOString()
    .split('T')[0]

  const { data } = await supabase.from('recurring_expenses')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')

  const expenses = (data as RecurringExpense[]) || []

  if (expenses.length === 0) return null

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  
  // 이번 달에 결제/기록이 완료된 항목 수
  const recordedCount = expenses.filter(exp => {
    if (!exp.last_recorded_date) return false
    return exp.last_recorded_date >= startDate && exp.last_recorded_date <= endDate
  }).length

  const totalCount = expenses.length
  const pendingCount = totalCount - recordedCount

  const status: 'pending' | 'partial' | 'complete' =
    pendingCount === 0 ? 'complete' : recordedCount === 0 ? 'pending' : 'partial'

  return {
    year_month: yearMonth,
    total_amount: totalAmount,
    recorded_count: recordedCount,
    total_count: totalCount,
    pending_count: pendingCount,
    status,
  }
}

/**
 * 모든 구독 조회
 */
export async function getAllRecurringExpenses(): Promise<RecurringExpense[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data } = await supabase.from('recurring_expenses')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  return (data as RecurringExpense[]) || []
}

/**
 * 새로운 구독 생성
 */
export async function createRecurringExpense(
  input: CreateRecurringExpenseInput
): Promise<RecurringExpense> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const nextDueDate = calculateNextDueDate(input.frequency, input.due_day_of_month)

  const { data, error } = await supabase.from('recurring_expenses')
    .insert({
      user_id: user.id,
      name: input.name,
      description: input.description || null,
      category_id: input.category_id || null,
      amount: input.amount,
      frequency: input.frequency,
      due_day_of_month: input.due_day_of_month,
      next_due_date: nextDueDate,
      owner_type: input.owner_type || null,
      is_business: input.is_business ?? true,
      is_auto_record: input.is_auto_record ?? true,
      allocation_status: input.allocation_status || null,
      status: input.status || 'active',
    })
    .select()
    .single()

  if (error) throw error
  return data as RecurringExpense
}

/**
 * 구독 업데이트
 */
export async function updateRecurringExpense(
  id: string,
  updates: UpdateRecurringExpenseInput
): Promise<RecurringExpense> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const current = await getRecurringExpenseById(id)
  if (!current) throw new Error('Not found')

  const updateData: Record<string, string | number | boolean | null> = {
    ...updates,
    updated_at: new Date().toISOString(),
  }

  if (updates.frequency || updates.due_day_of_month) {
    const freq = updates.frequency || current.frequency
    const day = updates.due_day_of_month || current.due_day_of_month
    updateData.next_due_date = calculateNextDueDate(freq, day)
  }

  const { data, error } = await supabase.from('recurring_expenses')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data as RecurringExpense
}

/**
 * 구독 기록 표시 (auto-record 시 호출)
 */
export async function recordRecurringExpense(
  id: string,
  transactionId?: string
): Promise<RecurringExpense> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const current = await getRecurringExpenseById(id)
  if (!current) throw new Error('Not found')

  const nextDueDate = calculateNextDueDate(current.frequency, current.due_day_of_month)

  const { data, error } = await supabase.from('recurring_expenses')
    .update({
      last_recorded_date: new Date().toISOString().split('T')[0],
      last_matched_transaction_id: transactionId || null,
      next_due_date: nextDueDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data as RecurringExpense
}

/**
 * 구독을 거래와 매칭
 */
export async function matchRecurringToTransaction(
  recurringId: string,
  transactionId: string
): Promise<RecurringExpense> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase.from('recurring_expenses')
    .update({
      last_matched_transaction_id: transactionId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', recurringId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data as RecurringExpense
}

/**
 * 구독 상태 토글 (active/inactive/paused)
 */
export async function toggleRecurringStatus(
  id: string,
  status: 'active' | 'inactive' | 'paused'
): Promise<RecurringExpense> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase.from('recurring_expenses')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data as RecurringExpense
}

/**
 * 구독 삭제
 */
export async function deleteRecurringExpense(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('recurring_expenses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
}
