import { getSupabaseClient, isSupabaseConfigured, PUBLIC_COUPLE_ID } from '../lib/supabase'
import type { SharedGoal } from '../types'

export async function fetchSharedGoals() {
  if (!isSupabaseConfigured) return [] as SharedGoal[]

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('shared_goals')
    .select('*')
    .eq('couple_id', PUBLIC_COUPLE_ID)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as SharedGoal[]
}

export async function createSharedGoal(payload: Partial<SharedGoal>) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.')
  }

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('shared_goals')
    .insert({ ...payload, couple_id: PUBLIC_COUPLE_ID })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as SharedGoal
}

export async function updateSharedGoal(id: string, updates: Partial<SharedGoal>) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.')
  }

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('shared_goals')
    .update(updates)
    .eq('id', id)
    .eq('couple_id', PUBLIC_COUPLE_ID)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as SharedGoal
}

export async function deleteSharedGoal(id: string) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.')
  }

  const client = getSupabaseClient()
  const { error } = await client.from('shared_goals').delete().eq('id', id).eq('couple_id', PUBLIC_COUPLE_ID)

  if (error) {
    throw error
  }
}
