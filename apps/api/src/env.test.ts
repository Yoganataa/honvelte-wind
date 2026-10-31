import { describe, expect, test } from 'bun:test'
import { envSchema } from './env'

describe('API environment schema', () => {
  test('provides bounded runtime defaults', () => {
    const parsed = envSchema.parse({})

    expect(parsed.SERVER_IDLE_TIMEOUT_SECONDS).toBe(30)
    expect(parsed.SERVER_MAX_REQUEST_BODY_BYTES).toBe(1_048_576)
    expect(parsed.SHUTDOWN_TIMEOUT_MS).toBe(15_000)
  })

  test('rejects out-of-range Bun server limits', () => {
    expect(
      envSchema.safeParse({ SERVER_IDLE_TIMEOUT_SECONDS: '256' }).success,
    ).toBe(false)
    expect(
      envSchema.safeParse({ SERVER_MAX_REQUEST_BODY_BYTES: '0' }).success,
    ).toBe(false)
    expect(envSchema.safeParse({ SHUTDOWN_TIMEOUT_MS: '120001' }).success).toBe(
      false,
    )
  })
})
