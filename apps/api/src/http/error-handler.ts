import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'

export function handleApiError(error: Error, c: Context) {
  if (error instanceof HTTPException) {
    return c.json(
      {
        error: {
          code: error.status === 413 ? 'PAYLOAD_TOO_LARGE' : 'BAD_REQUEST',
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
