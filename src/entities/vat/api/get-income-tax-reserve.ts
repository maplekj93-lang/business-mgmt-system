'use server'

import { getCurrentMonthVat } from './vat-api'
import { getUserSettings } from '@/entities/user-settings/api/get-user-settings'

export interface IncomeTaxReserve {
  total_income: number;
  income_tax_amount: number;
  rate: number;
}

export async function getIncomeTaxReserve(): Promise<IncomeTaxReserve | null> {
  try {
    const vat = await getCurrentMonthVat()
    const settings = await getUserSettings()

    if (!vat || !settings) return null

    const totalIncome = vat.total_income || 0
    const rate = settings.income_tax_rate || 0.15
    const incomeTaxAmount = totalIncome * rate

    return {
      total_income: totalIncome,
      income_tax_amount: incomeTaxAmount,
      rate,
    }
  } catch (error) {
    console.error('Failed to fetch income tax reserve:', error)
    return null
  }
}
