import { describe, expect, test } from 'bun:test'
import { healthResponseSchema, readinessResponseSchema } from './health'

describe('healthResponseSchema', () => {
  test('accepts a successful API health response', () => {
    const payload = {
      status: 'ok' as const,
      timestamp: '2026-10-31T12:00:00.000Z',
    }

    expect(healthResponseSchema.parse(payload)).toEqual(payload)
  })

  test('rejects an unknown status and an invalid timestamp', () => {
    expect(
      healthResponseSchema.safeParse({
        status: 'degraded',
        timestamp: 'not-a-date',
      }).success,
    ).toBe(false)
  })
})

describe('readinessResponseSchema', () => {
  test('accepts ready and not-ready responses', () => {
    const timestamp = '2026-10-31T12:00:00.000Z'

    expect(
      readinessResponseSchema.parse({ status: 'ready', timestamp }),
    ).toEqual({ status: 'ready', timestamp })
    expect(
      readinessResponseSchema.parse({ status: 'not_ready', timestamp }),
    ).toEqual({ status: 'not_ready', timestamp })
  })

  test('rejects unknown readiness states and invalid timestamps', () => {
    expect(
      readinessResponseSchema.safeParse({
        status: 'degraded',
        timestamp: 'not-a-date',
      }).success,
    ).toBe(false)
  })
})
