import type { MiddlewareHandler } from 'hono'

const REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/

export const requestId: MiddlewareHandler = async (c, next) => {
  const incomingId = c.req.header('x-request-id')
  const id =
    incomingId && REQUEST_ID_PATTERN.test(incomingId)
      ? incomingId
      : crypto.randomUUID()

  c.header('x-request-id', id)
  await next()
}
