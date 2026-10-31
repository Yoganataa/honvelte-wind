import { apiPaths, readinessResponseSchema } from '@honvelte/contracts'
import { Hono } from 'hono'
import type { RuntimeLifecycle } from '../runtime/lifecycle'

export function createHealthRoutes(lifecycle: RuntimeLifecycle) {
  const healthRoutes = new Hono()

  healthRoutes.get(apiPaths.health, (c) =>
    c.json({
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
    }),
  )

  healthRoutes.get(apiPaths.ready, (c) => {
    const ready = lifecycle.isReady()
    const response = readinessResponseSchema.parse({
      status: ready ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
    })

    return c.json(response, ready ? 200 : 503)
  })

  return healthRoutes
}
