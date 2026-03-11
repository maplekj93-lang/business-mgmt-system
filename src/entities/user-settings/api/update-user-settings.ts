'use server'

import { createClient } from '@/shared/api/supabase/server'
import { UserSettings } from '../model/types'

export async function updateUserSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase.from('user_settings')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data as UserSettings
}
