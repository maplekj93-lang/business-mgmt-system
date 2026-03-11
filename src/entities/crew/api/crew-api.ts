'use server'

import { createClient } from '@/shared/api/supabase/server'
import { CrewProfile } from '../model/types'

export async function getCrewProfiles(): Promise<CrewProfile[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('crew_profiles')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw error
  return data as CrewProfile[]
}

export async function createCrewProfile(
  profile: Omit<CrewProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<CrewProfile> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('crew_profiles')
    .insert({
      user_id: user.id,
      ...profile,
    })
    .select()
    .single()

  if (error) throw error
  return data as CrewProfile
}

export async function updateCrewProfile(
  id: string,
  updates: Partial<Omit<CrewProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<CrewProfile> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('crew_profiles')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data as CrewProfile
}

export async function deleteCrewProfile(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('crew_profiles')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
}

export async function getCrewByName(name: string): Promise<CrewProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('crew_profiles')
    .select('*')
    .eq('user_id', user.id)
    .eq('name', name)
    .eq('is_active', true)
    .single()

  return data as CrewProfile | null
}
