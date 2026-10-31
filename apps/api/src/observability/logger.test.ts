import { describe, expect, test } from 'bun:test'
import {
  createLogger,
  noopLogger,
  redactLogFields,
  type LogRecord,
} from './logger'

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

  test('sanitizes URL query strings and bounds oversized objects', () => {
    const fields = Object.fromEntries(
      Array.from({ length: 51 }, (_, index) => [`field${index}`, index]),
    )
    const safe = redactLogFields({
      endpoint: new URL('https://example.com/reports?token=private'),
      createdAt: new Date('2026-10-31T00:00:00.000Z'),
      ...fields,
    })

    expect(safe.endpoint).toBe('https://example.com/reports')
    expect(safe.createdAt).toBe('2026-10-31T00:00:00.000Z')
    expect(safe._truncated).toBe(true)
    expect(JSON.stringify(safe)).not.toContain('private')
  })

  test('routes default logger output to the matching console severity', () => {
    const calls = { debug: 0, info: 0, warn: 0, error: 0 }
    const original = {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error,
    }

    try {
      console.debug = () => {
        calls.debug += 1
      }
      console.info = () => {
        calls.info += 1
      }
      console.warn = () => {
        calls.warn += 1
      }
      console.error = () => {
        calls.error += 1
      }

      const logger = createLogger({ level: 'debug' })
      logger.debug('console.debug')
      logger.info('console.info')
      logger.warn('console.warn')
      logger.error('console.error')

      expect(calls).toEqual({ debug: 1, info: 1, warn: 1, error: 1 })
    } finally {
      console.debug = original.debug
      console.info = original.info
      console.warn = original.warn
      console.error = original.error
    }
  })

  test('noop logger accepts every severity without producing output', () => {
    noopLogger.debug('noop.debug')
    noopLogger.info('noop.info')
    noopLogger.warn('noop.warn')
    noopLogger.error('noop.error')
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
