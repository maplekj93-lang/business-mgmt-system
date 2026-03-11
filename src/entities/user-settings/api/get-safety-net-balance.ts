'use server'

import { createClient } from '@/shared/api/supabase/server'

export async function getSafetyNetBalance(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return 0

  const { data, error } = await supabase.from('assets')
    .select('current_balance')
    .eq('user_id', user.id)
    .eq('is_safety_net', true)

  if (error) {
    console.error('Failed to get safety net balance:', error)
    return 0
  }

  if (!data || data.length === 0) return 0

  return data.reduce((sum, asset) => sum + (asset.current_balance || 0), 0)
}
