import { API_BASE_PATH, apiPaths } from '@honvelte/contracts'
import { routePath } from 'hono/route'
import type { Context, MiddlewareHandler } from 'hono'
import type { HttpMetrics } from './http-metrics'
import type { Logger, LogLevel } from './logger'

export type HttpObservabilityOptions = {
  logger: Logger
  metrics: HttpMetrics
  now?: () => number
}

function resolveRouteTemplate(context: Context): string {
  try {
    const path = routePath(context)
    return path || 'unmatched'
  } catch {
    return 'unmatched'
  }
}

function resolveLogLevel(statusCode: number): LogLevel {
  if (statusCode >= 500) return 'error'
  if (statusCode >= 400) return 'warn'
  return 'info'
}

export function createHttpObservability(
  options: HttpObservabilityOptions,
): MiddlewareHandler {
  const now = options.now ?? (() => performance.now())

  return async (context, next) => {
    const startedAt = now()
    const isMetricsScrape =
      context.req.path === API_BASE_PATH + apiPaths.metrics

    if (!isMetricsScrape) options.metrics.beginRequest()

    try {
      await next()
    } finally {
      const durationMs = Math.max(0, now() - startedAt)
      const statusCode = context.res.status || 500
      const method = context.req.method.toUpperCase()
      const route = resolveRouteTemplate(context)

      if (!isMetricsScrape) {
        options.metrics.recordRequest({
          method,
          route,
          statusCode,
          durationSeconds: durationMs / 1_000,
        })
        options.metrics.endRequest()
      }

      const log = options.logger[resolveLogLevel(statusCode)]
      log('http.server.request.completed', {
        requestId: context.res.headers.get('x-request-id') ?? 'unknown',
        method,
        route,
        statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
      })
    }
  }
}
