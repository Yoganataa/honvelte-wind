import {
  API_BASE_PATH,
  apiPaths,
  noopTracing,
  validateTraceContextCarrier,
  type TraceContextCarrier,
  type Tracing,
} from '@honvelte/contracts'
import { routePath } from 'hono/route'
import type { Context, MiddlewareHandler } from 'hono'
import type { HttpMetrics } from './http-metrics'
import type { Logger, LogLevel } from './logger'

export type HttpObservabilityOptions = {
  logger: Logger
  metrics: HttpMetrics
  tracing?: Tracing
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

function inboundTraceContext(context: Context): TraceContextCarrier | undefined {
  return validateTraceContextCarrier({
    traceparent: context.req.header('traceparent'),
    tracestate: context.req.header('tracestate'),
  })
}

export function createHttpObservability(
  options: HttpObservabilityOptions,
): MiddlewareHandler {
  const now = options.now ?? (() => performance.now())
  const tracing = options.tracing ?? noopTracing

  return async (context, next) => {
    const startedAt = now()
    const isMetricsScrape =
      context.req.path === API_BASE_PATH + apiPaths.metrics

    await tracing.withSpan(
      'http.server.request',
      {
        kind: 'server',
        attributes: {
          'http.request.method': context.req.method.toUpperCase(),
        },
        ...(inboundTraceContext(context)
          ? { parent: inboundTraceContext(context) }
          : {}),
      },
      async (span) => {
        if (!isMetricsScrape) options.metrics.beginRequest()

        try {
          await next()
          const statusCode = context.res.status || 500
          const route = resolveRouteTemplate(context)

          span.setAttributes({
            'http.route': route,
            'http.response.status_code': statusCode,
          })
          if (statusCode >= 500) span.setStatus('error')
        } catch (error) {
          span.recordError(error)
          throw error
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

          options.logger[resolveLogLevel(statusCode)](
            'http.server.request.completed',
            {
              requestId: context.res.headers.get('x-request-id') ?? 'unknown',
              method,
              route,
              statusCode,
              durationMs: Math.round(durationMs * 100) / 100,
              ...(span.traceId ? { traceId: span.traceId } : {}),
              ...(span.spanId ? { spanId: span.spanId } : {}),
            },
          )
        }
      },
    )
  }
}
