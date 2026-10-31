import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'

export function handleApiError(error: Error, c: Context) {
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
                      : 'BAD_REQUEST',
          message: error.message,
        },
      },
      error.status,
    )
  }

  console.error({
    requestId: c.res.headers.get('x-request-id'),
    error,
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
