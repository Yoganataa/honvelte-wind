import { describe, expect, test } from 'bun:test'
import { createLogger, redactLogFields, type LogRecord } from './logger'

describe('structured logger', () => {
  test('filters records below the configured minimum level', () => {
    const records: LogRecord[] = []
    const logger = createLogger({
      level: 'warn',
      sink: (record) => records.push(record),
    })

    logger.debug('debug.event')
    logger.info('info.event')
    logger.warn('warn.event')
    logger.error('error.event')

    expect(records.map((record) => record.event)).toEqual([
      'warn.event',
      'error.event',
    ])
    expect(records.every((record) => record.level !== 'debug')).toBe(true)
  })

  test('redacts nested sensitive fields and bearer credentials', () => {
    const safe = redactLogFields({
      authorization: 'Bearer top-level-secret',
      nested: {
        access_token: 'access-secret',
        password: 'password-secret',
        message: 'upstream returned Bearer embedded-secret',
        safeValue: 'visible',
      },
      headers: [{ cookie: 'session=private', name: 'test' }],
    })

    expect(safe).toEqual({
      authorization: '[REDACTED]',
      nested: {
        access_token: '[REDACTED]',
        password: '[REDACTED]',
        message: 'upstream returned Bearer [REDACTED]',
        safeValue: 'visible',
      },
      headers: [{ cookie: '[REDACTED]', name: 'test' }],
    })
  })

  test('never serializes raw Error messages or stacks', () => {
    const safe = redactLogFields({
      error: new Error('failed while using token=private-value'),
    })

    expect(safe).toEqual({ error: { type: 'Error' } })
    expect(JSON.stringify(safe)).not.toContain('private-value')
  })

  test('bounds deeply nested, oversized, and circular values', () => {
    const circular: Record<string, unknown> = { value: 'safe' }
    circular.self = circular

    const safe = redactLogFields({
      circular,
      longValue: 'x'.repeat(1_100),
      deep: { one: { two: { three: { four: { five: { six: 'hidden' } } } } } },
    })

    expect((safe.circular as Record<string, unknown>).self).toBe('[CIRCULAR]')
    expect(String(safe.longValue)).toContain('[TRUNCATED]')
    expect(JSON.stringify(safe)).toContain('[MAX_DEPTH]')
  })

  test('writes structured records with reserved metadata fields', () => {
    const records: LogRecord[] = []
    const logger = createLogger({
      level: 'debug',
      sink: (record) => records.push(record),
    })

    logger.info('http.server.started', {
      port: 3000,
      level: 'error',
      event: 'spoofed.event',
    })

    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      level: 'info',
      event: 'http.server.started',
      port: 3000,
    })
    expect(records[0]?.timestamp).toBeTruthy()
  })
})
