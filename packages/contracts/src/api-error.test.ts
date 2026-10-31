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

  test('rejects undocumented error codes', () => {
    expect(
      apiErrorResponseSchema.safeParse({
        error: {
          code: 'RATE_LIMITED',
          message: 'Try again later',
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
