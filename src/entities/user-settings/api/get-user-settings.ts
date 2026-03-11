'use server'

import { createClient } from '@/shared/api/supabase/server'
import { UserSettings } from '../model/types'

export async function getUserSettings(): Promise<UserSettings | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch settings. If not found, create default settings.
  const { data, error } = await supabase.from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code === 'PGRST116') {
    // Record not found, insert default
    const { data: newData, error: insertError } = await supabase.from('user_settings')
      .insert({ user_id: user.id })
      .select()
      .single()
      
    if (insertError) throw insertError
    return newData as UserSettings
  }

  if (error) throw error
  return data as UserSettings
}
