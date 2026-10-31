import { timingSafeEqual } from 'node:crypto'
import { apiPaths } from '@honvelte/contracts'
import { Hono } from 'hono'
import type { HttpMetrics } from '../observability/http-metrics'

function isAuthorized(
  authorization: string | undefined,
  expectedToken: string,
) {
  if (!authorization?.startsWith('Bearer ')) return false

  const supplied = Buffer.from(authorization.slice(7))
  const expected = Buffer.from(expectedToken)

  return (
    supplied.length === expected.length &&
    timingSafeEqual(supplied, expected)
  )
}

export function createMetricsRoutes(metrics: HttpMetrics, token: string) {
  const routes = new Hono()

  routes.get(apiPaths.metrics, (c) => {
    if (!isAuthorized(c.req.header('authorization'), token)) {
      c.header('WWW-Authenticate', 'Bearer')
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED' as const,
            message: 'A valid metrics bearer token is required.',
          },
        },
        401,
      )
    }

    c.header('Cache-Control', 'no-store')
    c.header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
    return c.body(metrics.renderPrometheus())
  })

  return routes
}
