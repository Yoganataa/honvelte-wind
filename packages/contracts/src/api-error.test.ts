import { describe, expect, test } from 'bun:test'
import { apiErrorResponseSchema } from './api-error'

describe('apiErrorResponseSchema', () => {
  test('accepts a documented API error response', () => {
    expect(
      apiErrorResponseSchema.parse({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name is required',
        },
      }),
    ).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Name is required',
      },
    })
  })

  test('accepts rate-limit and gateway-timeout error responses', () => {
    for (const code of [
      'RATE_LIMITED',
      'RATE_LIMIT_UNAVAILABLE',
      'GATEWAY_TIMEOUT',
    ] as const) {
      expect(
        apiErrorResponseSchema.safeParse({
          error: { code, message: 'Request could not be completed.' },
        }).success,
      ).toBe(true)
    }
  })

  test('rejects undocumented error codes', () => {
    expect(
      apiErrorResponseSchema.safeParse({
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Not documented',
        },
      }).success,
    ).toBe(false)
  })

  test('rejects empty error messages', () => {
    expect(
      apiErrorResponseSchema.safeParse({
        error: {
          code: 'BAD_REQUEST',
          message: '',
        },
      }).success,
    ).toBe(false)
  })
})
