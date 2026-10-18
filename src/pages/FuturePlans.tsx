import { CalendarDays, PencilLine, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AddPlanModal } from '../components/AddPlanModal'
import { LoadingState } from '../components/LoadingState'
import { MemoryPhotoPicker } from '../components/MemoryPhotoPicker'
import { isSupabaseConfigured } from '../lib/supabase'
import { fetchMemories, getSignedImageUrl } from '../services/memories'
import { createFuturePlan, deleteFuturePlan, fetchFuturePlans, updateFuturePlan } from '../services/futurePlans'
import { fetchSiteSettings, upsertSiteSettings } from '../services/settings'
import type { FuturePlan, MemoryItem, SiteSettings } from '../types'

const fallbackPlans: FuturePlan[] = [
  { id: 'plan-1', couple_id: 'demo', title: 'Take a spontaneous weekend trip', description: 'A little adventure, just the two of us.', target_date: '2026-11-12', status: 'planned' },
  { id: 'plan-2', couple_id: 'demo', title: 'Create a home library', description: 'Share books, stories, and our favorite reads.', target_date: '2027-01-15', status: 'in_progress' },
]

export function FuturePlans() {
  const [plans, setPlans] = useState<FuturePlan[]>(isSupabaseConfigured ? [] : fallbackPlans)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<FuturePlan | null>(null)
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false)
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})

  const loadData = async () => {
    try {
      if (isSupabaseConfigured) {
        const [nextPlans, nextMemories, nextSettings] = await Promise.all([
          fetchFuturePlans(),
          fetchMemories(),
          fetchSiteSettings(),
        ])
        setPlans(nextPlans)
        setMemories(nextMemories)
        setSiteSettings(nextSettings)
      }
    } catch (error) {
      console.error(error)
      toast.error('Unable to load plans or photos.')
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

  const selectedImageId = siteSettings?.future_plan_image_id ?? memories[0]?.id ?? null
  const selectedMemory = memories.find((memory) => memory.id === selectedImageId) ?? memories[0] ?? null

  const handleCreateUpdate = async (payload: { title: string; description?: string; targetDate?: string; status: 'planned' | 'in_progress' | 'completed' }) => {
    setSaving(true)
    try {
      if (!isSupabaseConfigured) {
        const fakePlan: FuturePlan = {
          id: editingPlan?.id ?? `demo-plan-${Date.now()}`,
          couple_id: 'demo',
          title: payload.title,
          description: payload.description ?? '',
          target_date: payload.targetDate ?? null,
          status: payload.status,
        }
        setPlans((current) => {
          if (editingPlan) return current.map((plan) => plan.id === editingPlan.id ? fakePlan : plan)
          return [fakePlan, ...current]
        })
        setShowModal(false)
        setEditingPlan(null)
        return
      }

      if (editingPlan) {
        const updated = await updateFuturePlan(editingPlan.id, {
          title: payload.title,
          description: payload.description || null,
          target_date: payload.targetDate || null,
          status: payload.status,
        })
        setPlans((current) => current.map((plan) => (plan.id === updated.id ? updated : plan)))
      } else {
        const created = await createFuturePlan({
          title: payload.title,
          description: payload.description || null,
          target_date: payload.targetDate || null,
          status: payload.status,
        })
        setPlans((current) => [created, ...current])
      }
      setShowModal(false)
      setEditingPlan(null)
      toast.success(editingPlan ? 'Plan updated.' : 'Plan added.')
    } catch (error) {
      console.error(error)
      toast.error('Unable to save the plan.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this future plan?')) return
    try {
      if (isSupabaseConfigured) {
        await deleteFuturePlan(id)
      }
      setPlans((current) => current.filter((plan) => plan.id !== id))
      toast.success('Plan deleted.')
    } catch (error) {
      console.error(error)
      toast.error('Unable to delete this plan.')
    }
  }

  const handlePhotoSelect = async (memoryId: string) => {
    try {
      if (isSupabaseConfigured) {
        await upsertSiteSettings({ future_plan_image_id: memoryId })
      }
      setSiteSettings((current) => ({
        id: current?.id ?? 'local',
        couple_id: current?.couple_id ?? 'demo',
        home_background_ids: current?.home_background_ids ?? [],
        relationship_quotes: current?.relationship_quotes ?? [],
        future_plan_image_id: memoryId,
      }))
      setPhotoPickerOpen(false)
      toast.success('Future image updated.')
    } catch (error) {
      console.error(error)
      toast.error('Unable to update the selected image.')
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:px-10">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">Plan for Future</p>
          <h1 className="mt-2 text-4xl font-semibold text-slate-800">Dreams we are building together</h1>
        </div>
        <button type="button" onClick={() => setShowModal(true)} className="rounded-full bg-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 hover:bg-rose-600">
          Add a Plan for Future
        </button>
      </div>

      {loading ? <LoadingState message="Loading future plans..." /> : null}

      <div className="grid gap-8 xl:grid-cols-[1.5fr_0.8fr]">
        <div className="space-y-5">
          {!loading && plans.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-rose-200 bg-white p-10 text-center text-slate-600">
              No future plans yet. Add your first dream to build together.
            </div>
          ) : null}
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-[28px] border border-rose-100 bg-white p-5 shadow-lg shadow-rose-100/40">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold text-slate-800">{plan.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{plan.description || 'A beautiful step toward the life we are creating together.'}</p>
                </div>
                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">
                  {plan.status === 'in_progress' ? 'In Progress' : plan.status === 'completed' ? 'Completed' : 'Planned'}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-rose-400" /> {plan.target_date ? new Date(plan.target_date).toLocaleDateString() : 'No target date'}</span>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button type="button" onClick={() => { setEditingPlan(plan); setShowModal(true) }} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <PencilLine className="h-4 w-4" /> Edit
                </button>
                <button type="button" onClick={() => handleDelete(plan.id)} className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100">
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
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

      <AddPlanModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingPlan(null) }}
        onSubmit={handleCreateUpdate}
        loading={saving}
        initialValues={editingPlan ? {
          title: editingPlan.title,
          description: editingPlan.description ?? '',
          targetDate: editingPlan.target_date ?? '',
          status: editingPlan.status,
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
