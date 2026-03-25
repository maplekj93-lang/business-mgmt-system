'use server'

import { createClient } from '@/shared/api/supabase/server'
import { revalidatePath } from 'next/cache'
import { getDueThisMonth, recordRecurringExpense } from '@/entities/recurring-expense/api/recurring-expense-api'

/**
 * Auto-record pending recurring expenses as transactions
 * 1. 기한 된 구독 조회
 * 2. 각 구독에 대해 transaction 생성
 * 3. subscription.last_recorded_date 업데이트
 */
export async function recordPendingRecurringExpenses() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  try {
    const dueSubscriptions = await getDueThisMonth()

    if (dueSubscriptions.length === 0) {
      return { recorded: 0, message: '기록할 구독이 없습니다' }
    }

    // 주 자산 조회
    const { data: assets } = await supabase
      .from('assets')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    const assetId = assets?.id

    let recordedCount = 0
    const errors: string[] = []
    for (const subscription of dueSubscriptions) {
      try {
        if (!subscription.amount || Math.abs(subscription.amount) === 0) {
          console.log(`[Recurring] Skipping 0-amount subscription: ${subscription.name}`);
          continue;
        }

        const { data: transaction, error: txError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            asset_id: assetId || null,
            amount: -Math.abs(subscription.amount), // 지출은 음수
            category_id: subscription.category_id || null,
            description: `[자동기록] ${subscription.name}`,
            raw_description: subscription.name,
            allocation_status: subscription.is_business ? 'business_allocated' : 'personal',
            date: new Date().toISOString().split('T')[0],
            owner: subscription.owner_type || null,
          })
          .select()
          .single()

        if (txError) {
          errors.push(`${subscription.name}: 거래 생성 실패`)
          continue
        }

        await recordRecurringExpense(subscription.id, transaction?.id)
        recordedCount++
      } catch {
        errors.push(`${subscription.name}: 처리 중 오류 발생`)
      }
    }

    revalidatePath('/dashboard')
    revalidatePath('/business')

    return {
      recorded: recordedCount,
      total: dueSubscriptions.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `${recordedCount}개의 구독이 기록되었습니다`,
    }
  } catch (error) {
    throw error
  }
}

/**
 * 특정 구독들만 기록
 */
export async function recordSpecificRecurringExpenses(ids: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  try {
    const { data: assets } = await supabase
      .from('assets')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    const assetId = assets?.id

    const { data: subscriptions } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('user_id', user.id)
      .in('id', ids)

    if (!subscriptions || subscriptions.length === 0) {
      return { recorded: 0, message: '해당 구독을 찾을 수 없습니다' }
    }

    let recordedCount = 0

    for (const subscription of subscriptions) {
      if (!subscription.amount || Math.abs(subscription.amount) === 0) {
        console.log(`[Recurring] Skipping 0-amount subscription: ${subscription.name}`);
        continue;
      }

      const { data: transaction } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          asset_id: assetId || null,
          amount: -Math.abs(subscription.amount),
          category_id: subscription.category_id || null,
          description: `[자동기록] ${subscription.name}`,
          raw_description: subscription.name,
          allocation_status: subscription.is_business ? 'business_allocated' : 'personal',
          date: new Date().toISOString().split('T')[0],
          owner: subscription.owner_type || null,
        })
        .select()
        .single()

      if (transaction) {
        await recordRecurringExpense(subscription.id, transaction.id)
        recordedCount++
      }
    }

    revalidatePath('/dashboard')
    revalidatePath('/business')

    return {
      recorded: recordedCount,
      total: subscriptions.length,
      message: `${recordedCount}개의 구독이 기록되었습니다`,
    }
  } catch (error) {
    throw error
  }
}
