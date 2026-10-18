import { Plus, Trash2, PencilLine } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AddMemoryModal } from '../components/AddMemoryModal'
import { LoadingState } from '../components/LoadingState'
import { MemoryCard } from '../components/MemoryCard'
import { MemoryDetailsModal } from '../components/MemoryDetailsModal'
import { isSupabaseConfigured } from '../lib/supabase'
import { createMemory, deleteMemory, fetchMemories, getSignedImageUrl, updateMemory, uploadMemoryPhoto } from '../services/memories'
import type { MemoryItem } from '../types'

const fallbackMemories: MemoryItem[] = [
  {
    id: 'fallback-memory-1',
    couple_id: 'demo',
    title: 'Our First Date',
    story: 'The evening felt like the start of eternity. We laughed, shared stories, and the world narrowed to just us.',
    image_path: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    memory_date: '2024-01-21',
  },
  {
    id: 'fallback-memory-2',
    couple_id: 'demo',
    title: 'The Road Trip',
    story: 'We drove until the sunset found us, talking about dreams and listening to songs we would never forget.',
    image_path: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    memory_date: '2024-03-14',
  },
]

export function Memories() {
  const [memories, setMemories] = useState<MemoryItem[]>(isSupabaseConfigured ? [] : fallbackMemories)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedMemoryIndex, setSelectedMemoryIndex] = useState<number | null>(null)
  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null)
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const loadMemories = async () => {
    try {
      if (isSupabaseConfigured) {
        const nextMemories = await fetchMemories()
        setMemories(nextMemories)
      }
    } catch (error) {
      console.error(error)
      toast.error('Unable to load memories right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadMemories()
  }, [])

  useEffect(() => {
    const fetchUrls = async () => {
      try {
        const entries = await Promise.all(
          memories.map(async (memory) => [memory.id, await getSignedImageUrl(memory.image_path)] as const),
        )
        setImageUrls(Object.fromEntries(entries))
      } catch (error) {
        console.error(error)
        toast.error('Unable to load some memory photos.')
      }
    }

    void fetchUrls()
  }, [memories])

  const selectedMemory = selectedMemoryIndex !== null ? memories[selectedMemoryIndex] ?? null : null
  const selectedImageUrl = selectedMemory ? imageUrls[selectedMemory.id] || selectedMemory.image_path : ''

  const createOrUpdateMemory = async (payload: { title: string; story: string; memoryDate: string; file: File | null }) => {
    setSaving(true)
    try {
      if (!payload.file) {
        throw new Error('An image is required to create a memory.')
      }

      if (!isSupabaseConfigured) {
        toast.info('Supabase is not configured yet. The demo memory has been added locally for preview.')
        const newMemory = {
          id: `demo-${Date.now()}`,
          couple_id: 'demo',
          title: payload.title,
          story: payload.story,
          image_path: URL.createObjectURL(payload.file),
          memory_date: payload.memoryDate,
        } as MemoryItem
        setMemories((current) => [newMemory, ...current])
        setModalOpen(false)
        return
      }

      const uploadedPath = await uploadMemoryPhoto(payload.file)
      const memoryData = await createMemory({
        title: payload.title,
        story: payload.story,
        image_path: uploadedPath,
        memory_date: payload.memoryDate,
      })
      setMemories((current) => [memoryData, ...current])
      setModalOpen(false)
      toast.success('Memory saved successfully.')
    } catch (error) {
      console.error(error)
      toast.error('There was a problem saving the memory.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this memory?')) return

    try {
      if (isSupabaseConfigured) {
        await deleteMemory(id)
      }
      setMemories((current) => current.filter((memory) => memory.id !== id))
      if (selectedMemoryIndex !== null) {
        setSelectedMemoryIndex((current) => (current !== null && current > 0 ? current - 1 : null))
      }
      toast.success('Memory deleted.')
    } catch (error) {
      console.error(error)
      toast.error('Unable to delete this memory.')
    }
  }

  const handleOpenDetail = (index: number) => {
    setSelectedMemoryIndex(index)
  }

  const handleNext = () => {
    if (selectedMemoryIndex === null) return
    setSelectedMemoryIndex((selectedMemoryIndex + 1) % memories.length)
  }

  const handlePrevious = () => {
    if (selectedMemoryIndex === null) return
    setSelectedMemoryIndex((selectedMemoryIndex - 1 + memories.length) % memories.length)
  }

  const openEditor = (memory: MemoryItem) => {
    setEditingMemory(memory)
    setModalOpen(true)
  }

  const handleEdit = async (payload: { title: string; story: string; memoryDate: string; file: File | null }) => {
    if (!editingMemory) return
    setSaving(true)
    try {
      if (isSupabaseConfigured) {
        let nextImagePath = editingMemory.image_path
        if (payload.file) {
          nextImagePath = await uploadMemoryPhoto(payload.file)
        }
        const updated = await updateMemory(editingMemory.id, {
          title: payload.title,
          story: payload.story,
          memory_date: payload.memoryDate,
          image_path: nextImagePath,
        })
        setMemories((current) => current.map((memory) => (memory.id === editingMemory.id ? { ...memory, ...updated } : memory)))
      } else {
        setMemories((current) => current.map((memory) =>
          memory.id === editingMemory.id
            ? { ...memory, title: payload.title, story: payload.story, memory_date: payload.memoryDate, image_path: payload.file ? URL.createObjectURL(payload.file) : memory.image_path }
            : memory,
        ))
      }
      setModalOpen(false)
      setEditingMemory(null)
      toast.success('Memory updated.')
    } catch (error) {
      console.error(error)
      toast.error('Unable to update this memory.')
    } finally {
      setSaving(false)
    }
  }

  const memoryList = useMemo(() => memories, [memories])
  const editingValues = useMemo(() => editingMemory ? {
    title: editingMemory.title,
    story: editingMemory.story,
    memoryDate: editingMemory.memory_date ?? '',
  } : undefined, [editingMemory])

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:px-10">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">Memories</p>
          <h1 className="mt-2 text-4xl font-semibold text-slate-800">Our moments together</h1>
        </div>
        <button type="button" onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-600">
          <Plus className="h-4 w-4" />
          Add Memories
        </button>
      </div>

      {loading ? <LoadingState message="Loading our memories..." /> : null}

      {!loading && memoryList.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-rose-200 bg-white p-12 text-center text-slate-600">
          No memories yet. Add your first favorite moment.
        </div>
      ) : null}

      {memoryList.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {memoryList.map((memory, index) => (
            <div key={memory.id} className="relative">
              <MemoryCard memory={memory} imageUrl={imageUrls[memory.id] || memory.image_path} onOpenDetails={() => handleOpenDetail(index)} />
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" onClick={() => openEditor(memory)} className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50">
                  <PencilLine className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => handleDelete(memory.id)} className="rounded-full border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <AddMemoryModal
        open={modalOpen && !editingMemory}
        onClose={() => { setModalOpen(false); setEditingMemory(null) }}
        onSubmit={createOrUpdateMemory}
        loading={saving}
      />

      <AddMemoryModal
        open={Boolean(editingMemory)}
        onClose={() => { setEditingMemory(null); setModalOpen(false) }}
        onSubmit={handleEdit}
        loading={saving}
        imageRequired={false}
        existingImageUrl={editingMemory ? imageUrls[editingMemory.id] || editingMemory.image_path : undefined}
        initialValues={editingValues}
      />

      <MemoryDetailsModal
        memory={selectedMemory}
        imageUrl={selectedImageUrl}
        onClose={() => setSelectedMemoryIndex(null)}
        onNext={handleNext}
        onPrevious={handlePrevious}
        hasNext={Boolean(selectedMemory && memories.length > 1)}
        hasPrevious={Boolean(selectedMemory && memories.length > 1)}
      />
    </div>
  )
}
