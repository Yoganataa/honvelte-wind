import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { HTTPException } from 'hono/http-exception'
import { greetingSchema } from '@honvelte/contracts'

const app = new Hono()

app.use('*', secureHeaders())

app.use('*', async (c, next) => {
  const requestId = c.req.header('x-request-id') || crypto.randomUUID()
  c.header('x-request-id', requestId)
  await next()
})

app.get('/api/health', (c) =>
  c.json({
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
  }),
)

app.post('/api/greet', async (c) => {
  const contentLength = Number(c.req.header('content-length') ?? 0)
  if (contentLength > 1024) {
    throw new HTTPException(413, { message: 'Request body too large' })
  }

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    throw new HTTPException(400, { message: 'Malformed JSON body' })
  }

  const parsed = greetingSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Invalid request',
        },
      },
      400,
    )
  }

  return c.json({
    message: `Hello, ${parsed.data.name}!`,
  })
})

app.notFound((c) =>
  c.json(
    { error: { code: 'NOT_FOUND', message: 'Resource not found' } },
    404,
  ),
)

app.onError((error, c) => {
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
    { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' } },
    500,
  )
})

export type AppType = typeof app
export default app
