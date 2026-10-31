import { describe, expect, test } from 'bun:test'
import { healthResponseSchema } from './health'

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
