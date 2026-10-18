import { Check, ImageIcon } from 'lucide-react'
import type { MemoryItem } from '../types'

export function MemoryPhotoPicker({
  memories,
  imageUrls,
  selectedId,
  onSelect,
  onClose,
}: {
  memories: MemoryItem[]
  imageUrls: Record<string, string>
  selectedId: string | null
  onSelect: (id: string) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-[30px] bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-slate-800">Choose a memory photo</h3>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200">
            Close
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {memories.map((memory) => (
            <button
              key={memory.id}
              type="button"
              onClick={() => onSelect(memory.id)}
              className={`group relative overflow-hidden rounded-[24px] border-2 text-left transition ${
                selectedId === memory.id ? 'border-rose-400 shadow-lg shadow-rose-100' : 'border-transparent hover:border-rose-200'
              }`}
            >
              <div className="relative h-52 overflow-hidden bg-slate-200">
                {imageUrls[memory.id] ? (
                  <img src={imageUrls[memory.id]} alt={memory.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-rose-100 to-orange-100 text-rose-700">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                )}

                {selectedId === memory.id ? (
                  <div className="absolute right-3 top-3 rounded-full bg-rose-500 p-2 text-white shadow-lg">
                    <Check className="h-4 w-4" />
                  </div>
                ) : null}
              </div>
              <div className="p-3">
                <p className="font-medium text-slate-800">{memory.title}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
