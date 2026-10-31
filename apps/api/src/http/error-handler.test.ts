import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { describe, expect, test } from 'bun:test'
import { apiErrorResponseSchema } from '@honvelte/contracts'
import { handleApiError } from './error-handler'

describe('API error handler', () => {
  test('maps a gateway timeout to the shared timeout error code', async () => {
    const app = new Hono()
    app.onError(handleApiError)
    app.get('/timeout', () => {
      throw new HTTPException(504, {
        message: 'Request deadline exceeded.',
      })
    })

    const response = await app.request('/timeout')
    const body = apiErrorResponseSchema.parse(await response.json())

    expect(response.status).toBe(504)
    expect(body.error.code).toBe('GATEWAY_TIMEOUT')
  })

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
