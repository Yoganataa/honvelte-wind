import { routePath } from 'hono/route'
import type { MiddlewareHandler } from 'hono'
import type { HttpMetrics } from './http-metrics'
import type { Logger, LogLevel } from './logger'

export type HttpObservabilityOptions = {
  logger: Logger
  metrics: HttpMetrics
  now?: () => number
}

function resolveRouteTemplate(context: Parameters<MiddlewareHandler>[0]): string {
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
    options.metrics.beginRequest()

    try {
      await next()
    } finally {
      const durationMs = Math.max(0, now() - startedAt)
      const statusCode = context.res.status || 500
      const method = context.req.method.toUpperCase()
      const route = resolveRouteTemplate(context)

      options.metrics.recordRequest({
        method,
        route,
        statusCode,
        durationSeconds: durationMs / 1_000,
      })
      options.metrics.endRequest()

      options.logger[resolveLogLevel(statusCode)]('http.server.request.completed', {
        requestId: context.res.headers.get('x-request-id') ?? 'unknown',
        method,
        route,
        statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
      })
    }
  }
}
