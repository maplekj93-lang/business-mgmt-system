'use server'

import { createClient } from '@/shared/api/supabase/server'
import { BankRecord } from './parse-bank-export'

export type MatchStatus = 'matched' | 'candidate' | 'app_only' | 'bank_only'

export interface CrewPaymentMatch {
  payment_id?: string
  crew_name?: string
  paid_date?: string
  amount_net?: number
  bank_record?: BankRecord
  match_status: MatchStatus
}

function dayDiff(date1: string, date2: string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  return Math.abs((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24))
}

export async function matchCrewPayments(bankRecords: BankRecord[]): Promise<CrewPaymentMatch[]> {
  const supabase = await createClient()
  
  // Fetch candidate crew payments (paid but not verified yet)
  const { data: payments, error } = await supabase.from('crew_payments')
    .select('*')
    .eq('paid', true)
    .eq('bank_verified', false)

  if (error) throw error

  const matches: CrewPaymentMatch[] = []
  const usedBankRecords = new Set<number>()

  // 1. App payments matching loop
  for (const payment of payments || []) {
    const paymentDate = payment.paid_date ? payment.paid_date.split('T')[0] : ''
    if (!paymentDate) continue

    let matchedRecord: BankRecord | undefined = undefined
    let bestStatus: MatchStatus = 'app_only'
    let bestRecordIdx = -1

    for (let i = 0; i < bankRecords.length; i++) {
      if (usedBankRecords.has(i)) continue
      
      const record = bankRecords[i]
      const isDateMatch = dayDiff(paymentDate, record.date) <= 1
      const isAmountMatch = payment.amount_net === record.amount
      const isNameMatch = record.memo.replace(/\s+/g, '').includes(payment.crew_name.replace(/\s+/g, ''))

      if (isDateMatch && isAmountMatch) {
        if (isNameMatch) {
          bestStatus = 'matched'
          matchedRecord = record
          bestRecordIdx = i
          break // Perfect match found
        } else if (bestStatus !== 'candidate') {
          bestStatus = 'candidate'
          matchedRecord = record
          bestRecordIdx = i
        }
      }
    }

    if (bestRecordIdx !== -1 && bestStatus === 'matched') {
      usedBankRecords.add(bestRecordIdx)
    }

    matches.push({
      payment_id: payment.id,
      crew_name: payment.crew_name,
      paid_date: paymentDate,
      amount_net: payment.amount_net || 0,
      bank_record: matchedRecord,
      match_status: bestStatus
    })
  }

  // 2. Add bank_only records (Unused bank records)
  for (let i = 0; i < bankRecords.length; i++) {
    if (!usedBankRecords.has(i)) {
      // It might just be a regular expense, not a crew payment, so we might not want to show ALL bank records.
      // But the design says "⚠️ 통장엔 있는데 앱에 없음". 
      // If we show all bank expenses, it will overwhelm the user. We should probably only show candidates or warn.
      // For now, we will add them as 'bank_only' so the user is aware of unlinked withdrawals.
      matches.push({
        match_status: 'bank_only',
        bank_record: bankRecords[i]
      })
    }
  }

  return matches
}
