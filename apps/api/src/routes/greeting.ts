import { greetingSchema } from '@honvelte/contracts'
import { Hono } from 'hono'
import { readJsonBody } from '../http/read-json-body'

const greetingRoutes = new Hono()

greetingRoutes.post('/greet', async (c) => {
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

export default greetingRoutes
