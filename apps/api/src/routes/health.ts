import { Hono } from 'hono'

const healthRoutes = new Hono()

healthRoutes.get('/health', (c) =>
  c.json({
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
  }),
)

export default healthRoutes
