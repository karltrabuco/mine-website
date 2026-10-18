import { z } from 'zod'

export const memorySchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  story: z.string().min(1, 'Story is required.'),
  memoryDate: z.string(),
})

export const planSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional().or(z.literal('')),
  targetDate: z.string().optional().or(z.literal('')),
  status: z.enum(['planned', 'in_progress', 'completed']),
})

export const goalSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional().or(z.literal('')),
  targetDate: z.string().optional().or(z.literal('')),
})
