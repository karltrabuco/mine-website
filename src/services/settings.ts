import { getSupabaseClient, isSupabaseConfigured, PUBLIC_COUPLE_ID } from '../lib/supabase'
import type { SiteSettings } from '../types'

export async function fetchSiteSettings() {
  if (!isSupabaseConfigured) return null as SiteSettings | null

  const client = getSupabaseClient()
  const { data, error } = await client.from('site_settings').select('*').eq('couple_id', PUBLIC_COUPLE_ID).maybeSingle()

  if (error) {
    throw error
  }

  return data as SiteSettings
}

export async function upsertSiteSettings(settings: Partial<SiteSettings>) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.')
  }

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('site_settings')
    .upsert({ ...settings, couple_id: PUBLIC_COUPLE_ID }, { onConflict: 'couple_id' })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as SiteSettings
}
