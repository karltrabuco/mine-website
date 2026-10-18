import { Check, PencilLine, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AddGoalModal } from '../components/AddGoalModal'
import { LoadingState } from '../components/LoadingState'
import { MemoryPhotoPicker } from '../components/MemoryPhotoPicker'
import { isSupabaseConfigured } from '../lib/supabase'
import { fetchMemories, getSignedImageUrl } from '../services/memories'
import { createSharedGoal, deleteSharedGoal, fetchSharedGoals, updateSharedGoal } from '../services/goals'
import { fetchSiteSettings, upsertSiteSettings } from '../services/settings'
import type { MemoryItem, SharedGoal, SiteSettings } from '../types'

const fallbackGoals: SharedGoal[] = [
  { id: 'goal-1', couple_id: 'demo', title: 'Plan our dream trip', description: 'Save and schedule our next big adventure.', target_date: '2026-12-01', is_completed: false },
  { id: 'goal-2', couple_id: 'demo', title: 'Build a home together', description: 'Collect inspiration and make a plan for our first home.', target_date: '2027-06-20', is_completed: true, completed_at: '2026-10-17T12:00:00Z' },
]

export function GoalsTogether() {
  const [goals, setGoals] = useState<SharedGoal[]>(isSupabaseConfigured ? [] : fallbackGoals)
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SharedGoal | null>(null)
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false)
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>('all')

  const loadData = async () => {
    try {
      if (isSupabaseConfigured) {
        const [nextGoals, nextMemories, nextSettings] = await Promise.all([
          fetchSharedGoals(),
          fetchMemories(),
          fetchSiteSettings(),
        ])
        setGoals(nextGoals)
        setMemories(nextMemories)
        setSiteSettings(nextSettings)
      }
    } catch (error) {
      console.error(error)
      toast.error('Unable to load goals and photos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    let active = true

    const loadUrls = async () => {
      try {
        const entries = await Promise.all(
          memories.map(async (memory) => [memory.id, await getSignedImageUrl(memory.image_path)] as const),
        )
        if (active) setImageUrls(Object.fromEntries(entries))
      } catch (error) {
        console.error(error)
        if (active) toast.error('Unable to load some memory photos.')
      }
    }

    void loadUrls()

    return () => {
      active = false
    }
  }, [memories])

  const filteredGoals = useMemo(() => {
    if (filter === 'completed') return goals.filter((goal) => goal.is_completed)
    if (filter === 'in_progress') return goals.filter((goal) => !goal.is_completed)
    return goals
  }, [filter, goals])

  const completedCount = goals.filter((goal) => goal.is_completed).length
  const totalCount = goals.length
  const remainingCount = totalCount - completedCount
  const progress = totalCount ? Math.round((completedCount / totalCount) * 100) : 0

  const selectedImageId = siteSettings?.goals_image_id ?? memories[0]?.id ?? null
  const selectedMemory = memories.find((memory) => memory.id === selectedImageId) ?? memories[0] ?? null

  const handleSaveGoal = async (payload: { title: string; description?: string; targetDate?: string }) => {
    setSaving(true)
    try {
      if (!isSupabaseConfigured) {
        const fakeGoal: SharedGoal = {
          id: editingGoal?.id ?? `demo-goal-${Date.now()}`,
          couple_id: 'demo',
          title: payload.title,
          description: payload.description ?? '',
          target_date: payload.targetDate ?? null,
          is_completed: editingGoal?.is_completed ?? false,
          completed_at: editingGoal?.is_completed ? editingGoal.completed_at ?? new Date().toISOString() : null,
        }
        setGoals((current) => {
          if (editingGoal) return current.map((goal) => goal.id === editingGoal.id ? fakeGoal : goal)
          return [fakeGoal, ...current]
        })
        setShowModal(false)
        setEditingGoal(null)
        return
      }

      if (editingGoal) {
        const updated = await updateSharedGoal(editingGoal.id, {
          title: payload.title,
          description: payload.description || null,
          target_date: payload.targetDate || null,
        })
        setGoals((current) => current.map((goal) => (goal.id === editingGoal.id ? updated : goal)))
      } else {
        const created = await createSharedGoal({
          title: payload.title,
          description: payload.description || null,
          target_date: payload.targetDate || null,
        })
        setGoals((current) => [created, ...current])
      }
      setShowModal(false)
      setEditingGoal(null)
      toast.success(editingGoal ? 'Goal updated.' : 'Goal added.')
    } catch (error) {
      console.error(error)
      toast.error('Unable to save the goal.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this goal?')) return
    try {
      if (isSupabaseConfigured) {
        await deleteSharedGoal(id)
      }
      setGoals((current) => current.filter((goal) => goal.id !== id))
      toast.success('Goal deleted.')
    } catch (error) {
      console.error(error)
      toast.error('Unable to delete this goal.')
    }
  }

  const toggleGoal = async (goal: SharedGoal) => {
    const nextCompleted = !goal.is_completed
    try {
      const updated = {
        ...goal,
        is_completed: nextCompleted,
        completed_at: nextCompleted ? new Date().toISOString() : null,
      }
      if (isSupabaseConfigured) {
        const saved = await updateSharedGoal(goal.id, {
          is_completed: nextCompleted,
          completed_at: nextCompleted ? new Date().toISOString() : null,
        })
        setGoals((current) => current.map((item) => (item.id === goal.id ? saved : item)))
      } else {
        setGoals((current) => current.map((item) => (item.id === goal.id ? updated : item)))
      }
      toast.success(nextCompleted ? 'Goal completed! ❤️' : 'Goal marked in progress.')
    } catch (error) {
      console.error(error)
      toast.error('Unable to update goal status.')
    }
  }

  const handlePhotoSelect = async (memoryId: string) => {
    try {
      if (isSupabaseConfigured) {
        await upsertSiteSettings({ goals_image_id: memoryId })
      }
      setSiteSettings((current) => ({
        id: current?.id ?? 'local',
        couple_id: current?.couple_id ?? 'demo',
        home_background_ids: current?.home_background_ids ?? [],
        relationship_quotes: current?.relationship_quotes ?? [],
        goals_image_id: memoryId,
      }))
      setPhotoPickerOpen(false)
      toast.success('Goals photo updated.')
    } catch (error) {
      console.error(error)
      toast.error('Unable to update the photo.')
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:px-10">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">Goals Together</p>
          <h1 className="mt-2 text-4xl font-semibold text-slate-800">We are growing forward</h1>
        </div>
        <button type="button" onClick={() => setShowModal(true)} className="rounded-full bg-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 hover:bg-rose-600">
          Add Goals
        </button>
      </div>

      {loading ? <LoadingState message="Loading your goals..." /> : null}

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-[24px] border border-rose-100 bg-white p-4 shadow-lg shadow-rose-100/40">
          <p className="text-sm text-slate-500">Total goals</p>
          <p className="mt-2 text-3xl font-semibold text-slate-800">{totalCount}</p>
        </div>
        <div className="rounded-[24px] border border-rose-100 bg-white p-4 shadow-lg shadow-rose-100/40">
          <p className="text-sm text-slate-500">Completed</p>
          <p className="mt-2 text-3xl font-semibold text-rose-600">{completedCount}</p>
        </div>
        <div className="rounded-[24px] border border-rose-100 bg-white p-4 shadow-lg shadow-rose-100/40">
          <p className="text-sm text-slate-500">Remaining</p>
          <p className="mt-2 text-3xl font-semibold text-slate-800">{remainingCount}</p>
        </div>
        <div className="rounded-[24px] border border-rose-100 bg-white p-4 shadow-lg shadow-rose-100/40">
          <p className="text-sm text-slate-500">Progress</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-600">{progress}%</p>
        </div>
      </div>

      <div className="mb-6 flex gap-3">
        {(['all', 'in_progress', 'completed'] as const).map((state) => (
          <button
            key={state}
            type="button"
            onClick={() => setFilter(state)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === state ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {state === 'all' ? 'All' : state === 'in_progress' ? 'In Progress' : 'Completed'}
          </button>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.5fr_0.8fr]">
        <div className="space-y-5">
          {!loading && filteredGoals.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-rose-200 bg-white p-10 text-center text-slate-600">
              {goals.length === 0 ? 'No goals yet. Add your first goal to grow together.' : 'No goals match this filter.'}
            </div>
          ) : null}
          {filteredGoals.map((goal) => (
            <div key={goal.id} className={`rounded-[28px] border p-5 shadow-lg ${goal.is_completed ? 'border-emerald-200 bg-emerald-50/50 shadow-emerald-100/40' : 'border-rose-100 bg-white shadow-rose-100/40'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={goal.is_completed}
                    onChange={() => toggleGoal(goal)}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-rose-500 focus:ring-rose-200"
                  />
                  <div>
                    <h3 className={`text-xl font-semibold ${goal.is_completed ? 'text-emerald-700 line-through' : 'text-slate-800'}`}>{goal.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{goal.description || 'Shared goal and next step together.'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setEditingGoal(goal); setShowModal(true) }} className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50">
                    <PencilLine className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => handleDelete(goal.id)} className="rounded-full border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-500">
                <span>{goal.target_date ? new Date(goal.target_date).toLocaleDateString() : 'No target date'}</span>
                {goal.is_completed ? <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700"><Check className="h-3.5 w-3.5" /> Completed</span> : null}
              </div>
            </div>
          ))}
        </div>

        <aside className="rounded-[28px] border border-rose-100 bg-white p-5 shadow-xl shadow-rose-100/40">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-slate-800">Memory photo</h2>
            <button type="button" onClick={() => setPhotoPickerOpen(true)} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              Change Photo
            </button>
          </div>

          {selectedMemory ? (
            <img src={imageUrls[selectedMemory.id] || selectedMemory.image_path} alt={selectedMemory.title} className="h-[420px] w-full rounded-[22px] object-cover" />
          ) : (
            <div className="flex h-[420px] items-center justify-center rounded-[22px] border border-dashed border-rose-200 bg-rose-50 text-slate-500">No photo selected</div>
          )}
        </aside>
      </div>

      <AddGoalModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingGoal(null) }}
        onSubmit={handleSaveGoal}
        loading={saving}
        initialValues={editingGoal ? {
          title: editingGoal.title,
          description: editingGoal.description ?? '',
          targetDate: editingGoal.target_date ?? '',
        } : undefined}
      />

      {photoPickerOpen && memories.length > 0 ? (
        <MemoryPhotoPicker
          memories={memories}
          imageUrls={imageUrls}
          selectedId={selectedImageId}
          onSelect={handlePhotoSelect}
          onClose={() => setPhotoPickerOpen(false)}
        />
      ) : null}
    </div>
  )
}
