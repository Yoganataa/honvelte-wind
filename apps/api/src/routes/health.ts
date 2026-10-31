import { apiPaths } from '@honvelte/contracts'
import { Hono } from 'hono'

const healthRoutes = new Hono()

healthRoutes.get(apiPaths.health, (c) =>
  c.json({
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
  }),
)

export default healthRoutes
