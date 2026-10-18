import { useState, type FormEvent, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Footer } from './components/Footer'
import { Navbar } from './components/Navbar'
import { Home } from './pages/Home'
import { Memories } from './pages/Memories'
import { FuturePlans } from './pages/FuturePlans'
import { GoalsTogether } from './pages/GoalsTogether'

const SITE_PASSWORD = 'OurLoveStory-2026!'

function PasswordGate({ children }: { children: (onGoodbye: () => void) => ReactNode }) {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem('site-unlocked') === 'true',
  )
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleGoodbye() {
    sessionStorage.removeItem('site-unlocked')
    setPassword('')
    setError('')
    setUnlocked(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password === SITE_PASSWORD) {
      sessionStorage.setItem('site-unlocked', 'true')
      setUnlocked(true)
      setError('')
      return
    }

    setPassword('')
    setError('Incorrect password. Try again.')
  }

  if (!unlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 p-5 text-slate-800">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-xl shadow-rose-200/40"
        >
          <div className="mb-5 text-4xl text-rose-500" aria-hidden="true">♥</div>
          <h1 className="text-2xl font-semibold text-rose-600">Welcome to Our Love Story</h1>
          <p className="mt-3 text-slate-600">Enter our password to continue.</p>
          <label className="mt-5 block">
            <span className="sr-only">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-rose-200 px-4 py-3 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
              placeholder="Enter our password"
              aria-label="Password"
            />
          </label>
          {error ? <p role="alert" className="mt-3 text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            className="mt-5 w-full rounded-full bg-rose-500 px-5 py-3 font-semibold text-white transition hover:bg-rose-600"
          >
            Open Our World
          </button>
        </form>
      </main>
    )
  }

  return <>{children(handleGoodbye)}</>
}

function AppShell({ onGoodbye }: { onGoodbye: () => void }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff9fb_0%,_#fff3f5_35%,_#fdfaf7_100%)] text-slate-800">
      <Navbar onGoodbye={onGoodbye} />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/memories" element={<Memories />} />
          <Route path="/future-plans" element={<FuturePlans />} />
          <Route path="/goals" element={<GoalsTogether />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
      <Toaster position="top-right" richColors />
    </div>
  )
}

export default function App() {
  return (
    <PasswordGate>
      {(onGoodbye) => (
        <BrowserRouter>
          <AppShell onGoodbye={onGoodbye} />
        </BrowserRouter>
      )}
    </PasswordGate>
  )
}
