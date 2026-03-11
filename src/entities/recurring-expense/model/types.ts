/**
 * Recurring Expenses / Subscriptions Entity Types
 * Task 3: 고정비/구독 자동 기록
 */

/**
 * RecurringExpense interface - Database row structure
 * Represents a monthly/quarterly/annual recurring expense (subscription)
 */
export interface RecurringExpense {
  id: string
  user_id: string
  name: string                              // e.g., "Adobe Creative Cloud"
  description?: string | null
  category_id?: number | null               // FK to mdt_categories (integer)
  amount: number                            // Monthly/quarterly/annual amount
  frequency: 'monthly' | 'quarterly' | 'annual'
  due_day_of_month: number                  // 1-31
  next_due_date: string                     // ISO date: YYYY-MM-DD
  owner_type?: string | null                // "kwangjun" | "euiyoung" | "joint"
  is_business: boolean
  is_auto_record: boolean                   // true (자동 기록) | false (수동 결제)
  allocation_status?: string | null
  status: 'active' | 'inactive' | 'paused'
  last_recorded_date?: string | null        // When auto-recorded last time
  last_matched_transaction_id?: string | null
  created_at: string
  updated_at: string
}

/**
 * RecurringExpenseSummary interface - For monthly aggregation display
 * Used in dashboard and reports
 */
export interface RecurringExpenseSummary {
  year_month: string                        // "2026-03"
  total_amount: number
  recorded_count: number                    // How many recorded
  total_count: number                       // Total subscriptions
  pending_count: number                     // Not yet recorded
  status: 'pending' | 'partial' | 'complete'
}

/**
 * Constants for frequency selection
 */
export const FREQUENCIES = ['monthly', 'quarterly', 'annual'] as const
export type FrequencyType = typeof FREQUENCIES[number]

/**
 * Constants for owner type
 */
export const OWNER_TYPES = ['kwangjun', 'euiyoung', 'joint'] as const
export type OwnerType = typeof OWNER_TYPES[number]

/**
 * Constants for status
 */
export const RECURRING_STATUSES = ['active', 'inactive', 'paused'] as const
export type RecurringStatus = typeof RECURRING_STATUSES[number]

/**
 * Form data for creating/updating recurring expense
 */
export interface CreateRecurringExpenseInput {
  name: string
  description?: string
  category_id?: number
  amount: number
  frequency: FrequencyType
  due_day_of_month: number
  owner_type?: string
  is_business?: boolean
  is_auto_record?: boolean
  allocation_status?: string
  status?: RecurringStatus
}

/**
 * Helper type for update operations
 */
export type UpdateRecurringExpenseInput = Partial<CreateRecurringExpenseInput>
