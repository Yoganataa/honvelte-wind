import { API_BASE_PATH, apiPaths } from '@honvelte/contracts'
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { createApiErrorHandler } from './http/error-handler'
import { requestId } from './middleware/request-id'
import { createHttpObservability } from './observability/http-middleware'
import {
  createNoopHttpMetrics,
  type HttpMetrics,
} from './observability/http-metrics'
import { noopLogger, type Logger } from './observability/logger'
import {
  createRuntimeLifecycle,
  type RuntimeLifecycle,
} from './runtime/lifecycle'
import greetingRoutes from './routes/greeting'
import { createHealthRoutes } from './routes/health'
import { createMetricsRoutes } from './routes/metrics'

export type CreateAppOptions = {
  lifecycle?: RuntimeLifecycle
  logger?: Logger
  metrics?: HttpMetrics
  metricsEnabled?: boolean
  metricsToken?: string
}

export function createApp(options: CreateAppOptions = {}) {
  const lifecycle = options.lifecycle ?? createRuntimeLifecycle()
  const logger = options.logger ?? noopLogger
  const metrics = options.metrics ?? createNoopHttpMetrics()
  const metricsEnabled = options.metricsEnabled ?? false

  if (metricsEnabled && !options.metricsToken) {
    throw new Error(
      'A metrics bearer token is required when the metrics endpoint is enabled.',
    )
  }

  const app = new Hono()

  app.use('*', secureHeaders())
  app.use('*', requestId)
  app.use('*', createHttpObservability({ logger, metrics }))
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

  if (metricsEnabled && options.metricsToken) {
    app.route(
      API_BASE_PATH,
      createMetricsRoutes(metrics, options.metricsToken),
    )
  }

  app.notFound((c) =>
    c.json(
      { error: { code: 'NOT_FOUND', message: 'Resource not found' } },
      404,
    ),
  )

  app.onError(createApiErrorHandler(logger))

  return app
}

const app = createApp()

export type AppType = typeof app
export default app
