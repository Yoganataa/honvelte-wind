import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { describe, expect, test } from 'bun:test'
import { apiErrorResponseSchema } from '@honvelte/contracts'
import { createApiErrorHandler } from './error-handler'
import { createLogger, type LogRecord } from '../observability/logger'

describe('API error handler', () => {
  test('maps gateway timeouts to the shared timeout error code', async () => {
    const records: LogRecord[] = []
    const logger = createLogger({
      level: 'debug',
      sink: (record) => records.push(record),
    })
    const app = new Hono()
    app.onError(createApiErrorHandler(logger))
    app.get('/timeout', () => {
      throw new HTTPException(504, {
        message: 'Request deadline exceeded.',
      })
    })

    const response = await app.request('/timeout')
    const body = apiErrorResponseSchema.parse(await response.json())

    expect(response.status).toBe(504)
    expect(body.error.code).toBe('GATEWAY_TIMEOUT')
    expect(records).toHaveLength(0)
  })

  test('returns a sanitized 500 and logs only safe error metadata', async () => {
    const records: LogRecord[] = []
    const logger = createLogger({
      level: 'debug',
      sink: (record) => records.push(record),
    })
    const app = new Hono()

    app.use('*', async (c, next) => {
      c.header('x-request-id', 'error-test-123')
      await next()
    })
    app.onError(createApiErrorHandler(logger))
    app.get('/failure', () => {
      throw new Error('internal password=must-not-be-logged')
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
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      event: 'http.server.unhandled_error',
      requestId: 'error-test-123',
      errorType: 'Error',
    })
    expect(JSON.stringify(records)).not.toContain('must-not-be-logged')
  })
})
