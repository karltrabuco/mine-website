import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const planFormSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional().or(z.literal('')),
  targetDate: z.string().optional().or(z.literal('')),
  status: z.enum(['planned', 'in_progress', 'completed']),
})

type PlanFormValues = z.infer<typeof planFormSchema>

export function AddPlanModal({
  open,
  onClose,
  onSubmit,
  loading,
  initialValues,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (payload: PlanFormValues) => Promise<void>
  loading: boolean
  initialValues?: Partial<PlanFormValues>
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      title: initialValues?.title ?? '',
      description: initialValues?.description ?? '',
      targetDate: initialValues?.targetDate ?? '',
      status: initialValues?.status ?? 'planned',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        title: initialValues?.title ?? '',
        description: initialValues?.description ?? '',
        targetDate: initialValues?.targetDate ?? '',
        status: initialValues?.status ?? 'planned',
      })
    }
  }, [open, initialValues, reset])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-slate-800">{initialValues ? 'Edit Plan' : 'Add a Plan for Future'}</h3>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Plan title</label>
            <input {...register('title')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100" />
            {errors.title ? <p className="mt-2 text-sm text-red-500">{errors.title.message}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
            <textarea {...register('description')} rows={4} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Target date</label>
              <input type="date" {...register('targetDate')} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
              <select {...register('status')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100">
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading} className="rounded-full bg-rose-500 px-5 py-2.5 font-semibold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-600 disabled:opacity-60">
              {loading ? 'Saving...' : initialValues ? 'Save Changes' : 'Add Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
