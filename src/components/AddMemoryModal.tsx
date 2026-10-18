import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { memorySchema } from '../lib/validators'

type MemoryFormValues = {
  title: string
  story: string
  memoryDate: string
}

const defaultMemoryDate = new Date().toISOString().slice(0, 10)

export function AddMemoryModal({
  open,
  onClose,
  onSubmit,
  loading,
  imageRequired = true,
  existingImageUrl,
  initialValues,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (payload: { title: string; story: string; memoryDate: string; file: File | null }) => Promise<void>
  loading: boolean
  imageRequired?: boolean
  existingImageUrl?: string
  initialValues?: Partial<MemoryFormValues>
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MemoryFormValues>({
    resolver: zodResolver(memorySchema),
    defaultValues: {
      title: initialValues?.title ?? '',
      story: initialValues?.story ?? '',
      memoryDate: initialValues?.memoryDate ?? defaultMemoryDate,
    },
  })

  useEffect(() => {
    if (open && initialValues) {
      reset({
        title: initialValues?.title ?? '',
        story: initialValues?.story ?? '',
        memoryDate: initialValues?.memoryDate ?? defaultMemoryDate,
      })
    } else if (!open) {
      reset()
      setSelectedFile(null)
      setPreviewUrl(null)
    }
  }, [open, initialValues, reset])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    if (!file) {
      setSelectedFile(null)
      setPreviewUrl(null)
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Please upload a JPEG, PNG, or WebP image.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5MB.')
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const submitHandler = async (values: MemoryFormValues) => {
    if (imageRequired && !selectedFile) {
      alert('Please upload an image for this memory.')
      return
    }

    await onSubmit({
      title: values.title,
      story: values.story,
      memoryDate: values.memoryDate || defaultMemoryDate,
      file: selectedFile,
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[30px] bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-slate-800">{initialValues ? 'Edit Memory' : 'Add Memory'}</h3>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(submitHandler)} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
              <input {...register('title')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100" placeholder="Our first trip together" />
              {errors.title ? <p className="mt-2 text-sm text-red-500">{errors.title.message}</p> : null}
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Story</label>
              <textarea {...register('story')} rows={5} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100" placeholder="Tell your story..." />
              {errors.story ? <p className="mt-2 text-sm text-red-500">{errors.story.message}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Memory date</label>
              <input type="date" {...register('memoryDate')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Image</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600" />
            </div>
          </div>

          {previewUrl || existingImageUrl ? (
            <div className="overflow-hidden rounded-3xl border border-rose-100 bg-rose-50 p-3">
              <img src={previewUrl || existingImageUrl} alt="Memory preview" className="h-64 w-full rounded-2xl object-cover" />
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading} className="rounded-full bg-rose-500 px-5 py-2.5 font-semibold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Saving...' : initialValues ? 'Save Changes' : 'Save Memory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
