import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { MemoryItem } from '../types'

export function MemoryDetailsModal({
  memory,
  imageUrl,
  onClose,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
}: {
  memory: MemoryItem | null
  imageUrl: string
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
  hasNext: boolean
  hasPrevious: boolean
}) {
  if (!memory) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-[30px] bg-white shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 text-slate-700 shadow-sm backdrop-blur-sm hover:bg-white">
          <X className="h-5 w-5" />
        </button>

        <div className="grid gap-0 md:grid-cols-2">
          <div className="relative min-h-[320px] bg-slate-200">
            {imageUrl ? <img src={imageUrl} alt={memory.title} className="h-full w-full object-cover" /> : null}
            <div className="absolute inset-y-0 left-0 flex items-center">
              {hasPrevious ? (
                <button type="button" onClick={onPrevious} className="ml-3 rounded-full bg-white/80 p-2 text-slate-700 shadow-sm">
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : null}
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center">
              {hasNext ? (
                <button type="button" onClick={onNext} className="mr-3 rounded-full bg-white/80 p-2 text-slate-700 shadow-sm">
                  <ChevronRight className="h-5 w-5" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="p-6 md:p-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-rose-400">Our memory</p>
            <h3 className="text-3xl font-semibold text-slate-800">{memory.title}</h3>
            {memory.memory_date ? (
              <p className="mt-3 text-sm text-slate-500">{new Date(memory.memory_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            ) : null}
            <div className="mt-6 max-h-[420px] overflow-y-auto pr-2 text-base leading-8 text-slate-700">{memory.story}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
