import { describe, expect, test } from 'bun:test'
import { greetingResponseSchema, greetingSchema } from './greeting'

describe('greetingSchema', () => {
  test('trims surrounding whitespace', () => {
    expect(greetingSchema.parse({ name: '  Nata  ' })).toEqual({
      name: 'Nata',
    })
  })

  test('rejects an empty name', () => {
    const result = greetingSchema.safeParse({ name: '  ' })
    expect(result.success).toBe(false)
  })

  test('rejects names longer than 80 characters', () => {
    const result = greetingSchema.safeParse({ name: 'a'.repeat(81) })
    expect(result.success).toBe(false)
  })
})

describe('greetingResponseSchema', () => {
  test('accepts the API greeting response', () => {
    const payload = { message: 'Hello, Nata!' }
    expect(greetingResponseSchema.parse(payload)).toEqual(payload)
  })

  test('rejects an empty message', () => {
    const result = greetingResponseSchema.safeParse({ message: '' })
    expect(result.success).toBe(false)
  })
})
