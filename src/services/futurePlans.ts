import { getSupabaseClient, isSupabaseConfigured, PUBLIC_COUPLE_ID } from '../lib/supabase'
import type { FuturePlan } from '../types'

export async function fetchFuturePlans() {
  if (!isSupabaseConfigured) return [] as FuturePlan[]

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('future_plans')
    .select('*')
    .eq('couple_id', PUBLIC_COUPLE_ID)
    .order('target_date', { ascending: true, nullsFirst: false })

  if (error) {
    throw error
  }

  return (data ?? []) as FuturePlan[]
}

export async function createFuturePlan(payload: Partial<FuturePlan>) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.')
  }

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('future_plans')
    .insert({ ...payload, couple_id: PUBLIC_COUPLE_ID })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as FuturePlan
}

export async function updateFuturePlan(id: string, updates: Partial<FuturePlan>) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.')
  }

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('future_plans')
    .update(updates)
    .eq('id', id)
    .eq('couple_id', PUBLIC_COUPLE_ID)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as FuturePlan
}

export async function deleteFuturePlan(id: string) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.')
  }

  const client = getSupabaseClient()
  const { error } = await client.from('future_plans').delete().eq('id', id).eq('couple_id', PUBLIC_COUPLE_ID)

  if (error) {
    throw error
  }
}
