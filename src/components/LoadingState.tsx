import { LoaderCircle } from 'lucide-react'

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center gap-3 text-rose-700">
      <LoaderCircle className="h-5 w-5 animate-spin" />
      <span className="text-sm font-medium tracking-wide">{message}</span>
    </div>
  )
}
