export type CoupleSpace = {
  id: string
  name: string
  created_by?: string | null
  created_at?: string
}

export type MemoryItem = {
  id: string
  couple_id: string
  created_by?: string | null
  title: string
  story: string
  image_path: string
  memory_date?: string | null
  created_at?: string
  updated_at?: string
}

export type SiteSettings = {
  id: string
  couple_id: string
  home_background_ids: string[]
  active_home_background_id?: string | null
  future_plan_image_id?: string | null
  goals_image_id?: string | null
  relationship_intro?: string | null
  relationship_quotes: Array<{ text: string; author?: string }>
  updated_at?: string
}

export type FuturePlan = {
  id: string
  couple_id: string
  created_by?: string | null
  title: string
  description?: string | null
  target_date?: string | null
  status: 'planned' | 'in_progress' | 'completed'
  created_at?: string
  updated_at?: string
}

export type SharedGoal = {
  id: string
  couple_id: string
  created_by?: string | null
  title: string
  description?: string | null
  target_date?: string | null
  is_completed: boolean
  completed_at?: string | null
  created_at?: string
  updated_at?: string
}
