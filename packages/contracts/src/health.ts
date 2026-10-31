import { z } from 'zod'

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.iso.datetime(),
})

export type HealthResponse = z.infer<typeof healthResponseSchema>

export const readinessResponseSchema = z.object({
  status: z.enum(['ready', 'not_ready']),
  timestamp: z.iso.datetime(),
})

export type ReadinessResponse = z.infer<typeof readinessResponseSchema>
