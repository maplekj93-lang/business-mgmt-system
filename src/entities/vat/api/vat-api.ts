'use server'

import { createClient } from '@/shared/api/supabase/server'
import { VatReserve } from '../model/types'

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
 * 특정 월의 VAT 준비금 조회
 */
export async function getVatByMonth(yearMonth: string): Promise<VatReserve | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase.from('vat_reserves')
    .select('*')
    .eq('user_id', user.id)
    .eq('year_month', yearMonth)
    .single()

  return data as VatReserve | null
}

/**
 * 현재 월 VAT 준비금 조회
 */
export async function getCurrentMonthVat(): Promise<VatReserve | null> {
  return getVatByMonth(getCurrentMonth())
}

/**
 * VAT 준비금 금액 증가 (프로젝트 수입 매칭 시)
 */
export async function addVatFromIncome(incomeAmount: number): Promise<VatReserve> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const yearMonth = getCurrentMonth()
  const vatAmount = incomeAmount * 0.1  // 10% VAT

  // 해당 월의 VAT 레코드 조회
  const vat = await getVatByMonth(yearMonth)

  if (vat) {
    // 기존 레코드 업데이트
    const { data, error } = await supabase.from('vat_reserves')
      .update({
        total_income: vat.total_income + incomeAmount,
        vat_10_percent: vat.vat_10_percent + vatAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vat.id)
      .select()
      .single()

    if (error) throw error
    return data as VatReserve
  } else {
    // 새로운 레코드 생성
    const { data, error } = await supabase.from('vat_reserves')
      .insert({
        user_id: user.id,
        year_month: yearMonth,
        total_income: incomeAmount,
        vat_10_percent: vatAmount,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error
    return data as VatReserve
  }
}

/**
 * 모든 월의 VAT 준비금 조회
 */
export async function getAllVatReserves(): Promise<VatReserve[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data } = await supabase.from('vat_reserves')
    .select('*')
    .eq('user_id', user.id)
    .order('year_month', { ascending: false })

  return (data as VatReserve[]) || []
}

/**
 * VAT 상태 업데이트 (paid, filed 등)
 */
export async function updateVatStatus(
  id: string,
  status: 'pending' | 'paid' | 'filed',
  paidDate?: string
): Promise<VatReserve> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const updateData: { status: string; updated_at: string; vat_paid_date?: string } = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (paidDate && status === 'paid') {
    updateData.vat_paid_date = paidDate
  }

  const { data, error } = await supabase.from('vat_reserves')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data as VatReserve
}
