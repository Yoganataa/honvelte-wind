import { describe, expect, test } from 'bun:test'
import { greetingSchema } from './greeting'

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
