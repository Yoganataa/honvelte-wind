import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { HTTPException } from 'hono/http-exception'
import { greetingSchema } from '@honvelte/contracts'

const app = new Hono()
const MAX_REQUEST_BODY_BYTES = 1024

async function readJsonBody(request: Request): Promise<unknown> {
  const contentLength = request.headers.get('content-length')
  if (
    contentLength !== null &&
    Number.isFinite(Number(contentLength)) &&
    Number(contentLength) > MAX_REQUEST_BODY_BYTES
  ) {
    throw new HTTPException(413, { message: 'Request body too large' })
  }

  if (!request.body) {
    throw new HTTPException(400, { message: 'Malformed JSON body' })
  }

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      totalBytes += value.byteLength
      if (totalBytes > MAX_REQUEST_BODY_BYTES) {
        await reader.cancel()
        throw new HTTPException(413, { message: 'Request body too large' })
      }

      chunks.push(value)
    }
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(400, { message: 'Malformed JSON body' })
  } finally {
    reader.releaseLock()
  }

  const bytes = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown
  } catch {
    throw new HTTPException(400, { message: 'Malformed JSON body' })
  }
}

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
  const body = await readJsonBody(c.req.raw)

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
