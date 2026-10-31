import { Hono } from 'hono'
import { describe, expect, test } from 'bun:test'
import { createApiErrorHandler } from '../http/error-handler'
import { createLogger, type LogRecord } from './logger'

describe('API error handler', () => {
  test('logs the error type and request ID without serializing exception details', async () => {
    const records: LogRecord[] = []
    const logger = createLogger({
      level: 'debug',
      sink: (record) => records.push(record),
    })
    const app = new Hono()

    app.onError(createApiErrorHandler(logger))
    app.get('/failure', () => {
      throw new Error('database password=must-not-be-logged')
    })

    const response = await app.request('/failure')

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      },
    })
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      event: 'http.server.unhandled_error',
      errorType: 'Error',
    })
    expect(JSON.stringify(records)).not.toContain('must-not-be-logged')
  })
})
