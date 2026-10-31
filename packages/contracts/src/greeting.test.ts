import { describe, expect, test } from 'bun:test'
import { greetingResponseSchema, greetingSchema } from './greeting'

describe('greetingSchema', () => {
  test('trims surrounding whitespace', () => {
    expect(greetingSchema.parse({ name: '  Nata  ' })).toEqual({
      name: 'Nata',
    })
  })

  test('rejects an empty name', () => {
    expect(greetingSchema.safeParse({ name: '  ' }).success).toBe(false)
  })

  test('rejects names longer than 80 characters', () => {
    expect(greetingSchema.safeParse({ name: 'a'.repeat(81) }).success).toBe(
      false,
    )
  })
})

describe('greetingResponseSchema', () => {
  test('accepts the API greeting response', () => {
    expect(
      greetingResponseSchema.parse({ message: 'Hello, Nata!' }),
    ).toEqual({ message: 'Hello, Nata!' })
  })

  test('rejects an empty message', () => {
    expect(greetingResponseSchema.safeParse({ message: '' }).success).toBe(
      false,
    )
  })
})
