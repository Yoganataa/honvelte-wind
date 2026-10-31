import { API_BASE_PATH, apiPaths } from '@honvelte/contracts'
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { handleApiError } from './http/error-handler'
import { requestId } from './middleware/request-id'
import {
  createRuntimeLifecycle,
  type RuntimeLifecycle,
} from './runtime/lifecycle'
import greetingRoutes from './routes/greeting'
import { createHealthRoutes } from './routes/health'

export function createApp(
  lifecycle: RuntimeLifecycle = createRuntimeLifecycle(),
) {
  const app = new Hono()

  app.use('*', secureHeaders())
  app.use('*', requestId)
  app.use('*', async (c, next) => {
    const healthPath = API_BASE_PATH + apiPaths.health
    const readinessPath = API_BASE_PATH + apiPaths.ready
    const isProbe = c.req.path === healthPath || c.req.path === readinessPath

    if (!lifecycle.isReady() && !isProbe) {
      return c.json(
        {
          error: {
            code: 'SERVICE_UNAVAILABLE' as const,
            message: 'Server is shutting down',
          },
        },
        503,
      )
    }

    await next()
  })

  app.route(API_BASE_PATH, createHealthRoutes(lifecycle))
  app.route(API_BASE_PATH, greetingRoutes)

  app.notFound((c) =>
    c.json(
      { error: { code: 'NOT_FOUND', message: 'Resource not found' } },
      404,
    ),
  )

  app.onError(handleApiError)

  return app
}

const app = createApp()

export type AppType = typeof app
export default app
