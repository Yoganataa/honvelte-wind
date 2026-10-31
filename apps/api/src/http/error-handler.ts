import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Logger } from '../observability/logger'

export function createApiErrorHandler(logger: Logger) {
  return (error: Error, c: Context) => {
    if (error instanceof HTTPException) {
      return c.json(
        {
          error: {
            code:
              error.status === 413
                ? 'PAYLOAD_TOO_LARGE'
                : error.status === 429
                  ? 'RATE_LIMITED'
                  : error.status === 503
                    ? 'RATE_LIMIT_UNAVAILABLE'
                    : error.status === 504
                      ? 'GATEWAY_TIMEOUT'
                      : error.status === 404
                        ? 'NOT_FOUND'
                        : error.status === 401
                          ? 'UNAUTHORIZED'
                          : 'BAD_REQUEST',
            message: error.message,
          },
        },
        error.status,
      )
    }

    logger.error('http.server.unhandled_error', {
      requestId: c.res.headers.get('x-request-id') ?? 'unknown',
      route: c.req.path,
      errorType: error.name || 'Error',
    })

    return c.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        },
      },
      500,
    )
  }
}
