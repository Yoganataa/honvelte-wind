import { z } from 'zod'

export const greetingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(80, 'Name must be 80 characters or fewer'),
})

export const greetingResponseSchema = z.object({
  message: z.string().min(1),
})

export type GreetingInput = z.infer<typeof greetingSchema>
export type GreetingResponse = z.infer<typeof greetingResponseSchema>
