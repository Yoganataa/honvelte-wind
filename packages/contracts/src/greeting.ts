import { z } from 'zod'

export const greetingSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name must be 80 characters or fewer'),
})

export type GreetingInput = z.infer<typeof greetingSchema>

export interface GreetingResponse {
  message: string
}
