import { getSupabaseClient, isSupabaseConfigured, PUBLIC_COUPLE_ID } from '../lib/supabase'
import type { MemoryItem } from '../types'

export async function fetchMemories() {
  if (!isSupabaseConfigured) return [] as MemoryItem[]

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('memories')
    .select('*')
    .eq('couple_id', PUBLIC_COUPLE_ID)
    .order('memory_date', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as MemoryItem[]
}

export async function createMemory(payload: {
  title: string
  story: string
  image_path: string
  memory_date?: string | null
}) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.')
  }

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('memories')
    .insert({
      ...payload,
      couple_id: PUBLIC_COUPLE_ID,
      memory_date: payload.memory_date || new Date().toISOString().slice(0, 10),
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateMemory(id: string, updates: Partial<MemoryItem>) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.')
  }

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('memories')
    .update(updates)
    .eq('id', id)
    .eq('couple_id', PUBLIC_COUPLE_ID)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function deleteMemory(id: string) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.')
  }

  const client = getSupabaseClient()
  const { error } = await client.from('memories').delete().eq('id', id).eq('couple_id', PUBLIC_COUPLE_ID)

  if (error) {
    throw error
  }
}

export async function uploadMemoryPhoto(file: File) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.')
  }

  const client = getSupabaseClient()
  const safeName = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
  const storagePath = `memories/${safeName}`

  const { error: uploadError } = await client.storage.from('memory-photos').upload(storagePath, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (uploadError) {
    throw uploadError
  }

  return storagePath
}

export async function getSignedImageUrl(path: string) {
  if (!isSupabaseConfigured) {
    return path
  }

  if (/^(https?:|blob:|data:)/i.test(path)) {
    return path
  }

  const client = getSupabaseClient()
  const { data, error } = await client.storage.from('memory-photos').createSignedUrl(path, 3600)

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('Unable to create a signed URL for this memory photo.')
  }

  return data.signedUrl
}
