import { Hono } from 'hono'
import { describe, expect, test } from 'bun:test'
import { apiErrorResponseSchema } from '@honvelte/contracts'
import { handleApiError } from './error-handler'

describe('API error handler', () => {
  test('returns a sanitized 500 response for unexpected errors', async () => {
    const app = new Hono()
    app.onError(handleApiError)
    app.get('/failure', () => {
      throw new Error('internal implementation detail')
    })

    const response = await app.request('/failure')
    const body = apiErrorResponseSchema.parse(await response.json())

    expect(response.status).toBe(500)
    expect(body).toEqual({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      },
    })
  })
})
