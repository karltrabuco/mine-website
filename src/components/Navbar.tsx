import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Memories', to: '/memories' },
  { label: 'Plan for Future', to: '/future-plans' },
  { label: 'Goals Together', to: '/goals' },
]

export function Navbar({ onGoodbye }: { onGoodbye: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-rose-100 bg-white/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-200 via-rose-100 to-orange-100 text-lg font-semibold text-rose-700 shadow-sm">
            ❤
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-rose-400">Together</p>
            <h1 className="text-lg font-semibold text-slate-800">Our Love Story</h1>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-rose-100 text-rose-700' : 'text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={onGoodbye}
            className="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
          >
            Good bye ❤️
          </button>
        </div>

        <button
          type="button"
          className="inline-flex rounded-full border border-rose-100 p-2 text-slate-700 md:hidden"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {mobileOpen ? (
        <div className="border-t border-rose-100 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-rose-100 text-rose-700' : 'text-slate-700 hover:bg-rose-50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false)
                onGoodbye()
              }}
              className="mt-2 rounded-xl bg-rose-500 px-3 py-2 text-left text-sm font-medium text-white transition hover:bg-rose-600"
            >
              Good bye ❤️
            </button>
          </div>
        </div>
      ) : null}
    </header>
  )
}
