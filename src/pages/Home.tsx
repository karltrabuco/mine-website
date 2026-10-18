import { ChevronLeft, ChevronRight, Heart, Quote } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState } from '../components/LoadingState'
import { isSupabaseConfigured } from '../lib/supabase'
import { fetchMemories, getSignedImageUrl } from '../services/memories'
import { fetchSiteSettings } from '../services/settings'
import type { MemoryItem, SiteSettings } from '../types'

const defaultQuotes = [
  { text: 'Love is not only looking at each other, it is looking in the same direction.', author: 'Antoine de Saint-Exupéry' },
  { text: 'The best thing to hold onto in life is each other.', author: 'Audrey Hepburn' },
  { text: 'To love is to grow together, not just to be together.', author: 'Unknown' },
]

const fallbackMemories: MemoryItem[] = [
  {
    id: 'fallback-1',
    couple_id: 'demo',
    title: 'Our First Sunset Walk',
    story: 'We found our rhythm in the golden hour and never stopped choosing each other.',
    image_path: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?...',
    memory_date: '2024-02-12',
  },
  {
    id: 'fallback-2',
    couple_id: 'demo',
    title: 'Coffee Date Morning',
    story: 'The small moments became our favorite rituals, one cup and one smile at a time.',
    image_path: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?...',
    memory_date: '2024-03-02',
  },
  {
    id: 'fallback-3',
    couple_id: 'demo',
    title: 'Weekend Road Trip',
    story: 'There is a kind of joy that only exists when you are turning the next corner together.',
    image_path: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?...',
    memory_date: '2024-04-15',
  },
  {
    id: 'fallback-4',
    couple_id: 'demo',
    title: 'Home Is Where We Are',
    story: 'We learned that love feels like peace, laughter, and a room filled with our future.',
    image_path: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?...',
    memory_date: '2024-06-07',
  },
  {
    id: 'fallback-5',
    couple_id: 'demo',
    title: 'Dreaming Together',
    story: 'Every plan became brighter when we imagined it side by side.',
    image_path: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?...',
    memory_date: '2024-08-11',
  },
]

export function Home() {
  const [quotes] = useState(defaultQuotes)
  const [loading, setLoading] = useState(true)
  const [memories, setMemories] = useState<MemoryItem[]>(isSupabaseConfigured ? [] : fallbackMemories)
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [bgIndex, setBgIndex] = useState(0)
  const slideshowRef = useRef<number | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        if (isSupabaseConfigured) {
          const [nextMemories, nextSettings] = await Promise.all([fetchMemories(), fetchSiteSettings()])
          setMemories(nextMemories)
          if (nextSettings) setSettings(nextSettings)
        }
      } catch (error) {
        console.error('Unable to load home data', error)
        toast.error('Unable to load our story right now.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  useEffect(() => {
    let active = true

    const resolveImageUrls = async () => {
      try {
        const entries = await Promise.all(
          memories.map(async (memory) => [memory.id, await getSignedImageUrl(memory.image_path)] as const),
        )
        if (active) setImageUrls(Object.fromEntries(entries))
      } catch (error) {
        console.error('Unable to load memory photos', error)
        if (active) toast.error('Unable to load some memory photos.')
      }
    }

    void resolveImageUrls()
    return () => {
      active = false
    }
  }, [memories])

  useEffect(() => {
    if (memories.length <= 1) return
    slideshowRef.current = window.setInterval(() => {
      setBgIndex((current) => (current + 1) % memories.length)
    }, 5000)

    return () => {
      if (slideshowRef.current) {
        window.clearInterval(slideshowRef.current)
      }
    }
  }, [memories])

  const backgroundItems = useMemo(() => {
    if (settings?.home_background_ids?.length) {
      const ordered = settings.home_background_ids
        .map((id) => memories.find((memory) => memory.id === id))
        .filter(Boolean) as MemoryItem[]

      if (ordered.length) {
        return ordered.slice(0, 5)
      }
    }

    return memories.slice(0, 5)
  }, [memories, settings])

  const activeBackground = backgroundItems[bgIndex] ?? backgroundItems[0]

  if (loading) {
    return <LoadingState message="Loading our story..." />
  }

  return (
    <div className="pb-16">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          {activeBackground ? (
            <img
              key={activeBackground.id}
              src={imageUrls[activeBackground.id] || activeBackground.image_path}
              alt={activeBackground.title}
              className="h-full w-full object-cover opacity-90 transition-all duration-700"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-900/60 to-rose-950/30" />
        </div>

        <div className="relative mx-auto flex min-h-[760px] max-w-6xl items-center px-6 py-16 md:px-10">
          <div className="max-w-2xl text-white">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.26em] text-rose-100 backdrop-blur-sm">
              <Heart className="h-3.5 w-3.5 text-rose-200" />
              A love story in bloom
            </div>

            <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.05em] md:text-7xl">Our Love Story</h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-rose-50/90">
              {settings?.relationship_intro ||
                'Every chapter of our journey is a reminder that love grows best when it is nurtured with patience, laughter, and the courage to keep choosing each other.'}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/memories"
                className="rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-rose-500/30 transition hover:bg-rose-400"
              >
                Explore Our Memories
              </Link>
              <Link
                to="/future-plans"
                className="rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
              >
                Dream About Our Future
              </Link>
            </div>

            {backgroundItems.length > 1 ? (
              <div className="mt-10 flex items-center gap-3">
                <button type="button" onClick={() => setBgIndex((current) => (current - 1 + backgroundItems.length) % backgroundItems.length)} className="rounded-full border border-white/25 bg-white/10 p-2 text-white" aria-label="Previous background">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex gap-2">
                  {backgroundItems.map((memory, index) => (
                    <button
                      key={memory.id}
                      type="button"
                      onClick={() => setBgIndex(index)}
                      className={`h-2.5 rounded-full transition-all ${
                        bgIndex === index ? 'w-10 bg-white' : 'w-2.5 bg-white/50'
                      }`}
                      aria-label={`View background ${index + 1}: ${memory.title}`}
                    />
                  ))}
                </div>
                <button type="button" onClick={() => setBgIndex((current) => (current + 1) % backgroundItems.length)} className="rounded-full border border-white/25 bg-white/10 p-2 text-white" aria-label="Next background">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 md:px-10">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">Our journey</p>
          <h2 className="mt-3 text-4xl font-semibold text-slate-800">Little moments, big love</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {backgroundItems.slice(0, 3).map((memory) => (
            <div key={memory.id} className="overflow-hidden rounded-[26px] border border-rose-100 bg-white shadow-lg shadow-rose-100/40">
              <img src={imageUrls[memory.id] || memory.image_path} alt={memory.title} className="h-64 w-full object-cover" />
              <div className="p-5">
                <h3 className="text-xl font-semibold text-slate-800">{memory.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{memory.story}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white/60 py-20">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <div className="mb-8 text-center">
            <Quote className="mx-auto h-10 w-10 text-rose-400" />
            <h2 className="mt-4 text-4xl font-semibold text-slate-800">Words we live by</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {quotes.map((quote) => (
              <blockquote key={quote.text} className="rounded-[28px] border border-rose-100 bg-gradient-to-br from-white to-rose-50 p-7 shadow-md shadow-rose-100/50">
                <p className="text-lg leading-8 text-slate-700">“{quote.text}”</p>
                <footer className="mt-5 text-sm font-medium uppercase tracking-[0.2em] text-rose-500">{quote.author}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 md:px-10">
        <div className="rounded-[32px] border border-rose-100 bg-white px-6 py-12 text-center shadow-xl shadow-rose-100/60 md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">The next chapter</p>
          <h2 className="mt-4 text-4xl font-semibold text-slate-800">A future full of us</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Our story isn’t only about the past. It is about the promises we keep, the dreams we share, and the life we build one gentle choice at a time.
          </p>
          <Link
            to="/memories"
            className="mt-8 inline-flex rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-rose-200 transition hover:bg-rose-600"
          >
            Explore Our Memories
          </Link>
        </div>
      </section>
    </div>
  )
}
