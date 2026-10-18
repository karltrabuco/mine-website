import { CalendarDays, Sparkles } from 'lucide-react'
import type { MemoryItem } from '../types'

export function MemoryCard({
  memory,
  imageUrl,
  onOpenDetails,
}: {
  memory: MemoryItem
  imageUrl?: string
  onOpenDetails: () => void
}) {
  return (
    <article className="overflow-hidden rounded-[28px] border border-rose-100 bg-white shadow-lg shadow-rose-100/50 transition hover:-translate-y-1 hover:shadow-xl">
      <button type="button" onClick={onOpenDetails} className="block w-full text-left">
        <div className="relative h-64 overflow-hidden bg-slate-200">
          {imageUrl ? (
            <img src={imageUrl} alt={memory.title} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-rose-100 to-orange-100 text-rose-700">
              <Sparkles className="h-12 w-12" />
            </div>
          )}
        </div>
      </button>

      <div className="space-y-3 p-5">
        <button type="button" onClick={onOpenDetails} className="text-left text-xl font-semibold text-slate-800 hover:text-rose-600">
          {memory.title}
        </button>

        {memory.memory_date ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays className="h-4 w-4 text-rose-400" />
            <span>{new Date(memory.memory_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        ) : null}

        <p className="line-clamp-3 text-sm leading-6 text-slate-600">{memory.story}</p>
      </div>
    </article>
  )
}
