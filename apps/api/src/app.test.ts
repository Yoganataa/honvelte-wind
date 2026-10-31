import {
  apiErrorResponseSchema,
  greetingResponseSchema,
} from '@honvelte/contracts'
import { describe, expect, test } from 'bun:test'
import app from './app'

describe('API app', () => {
  test('returns a health response with a request ID', async () => {
    const response = await app.request('/api/health')
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('x-request-id')).toBeTruthy()
    expect(body.status).toBe('ok')
  })

  test('preserves a caller-provided request ID', async () => {
    const response = await app.request('/api/health', {
      headers: { 'x-request-id': 'request-test-123' },
    })

    expect(response.headers.get('x-request-id')).toBe('request-test-123')
  })

  test('returns a greeting matching the shared response contract', async () => {
    const response = await app.request('/api/greet', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Nata' }),
    })

    expect(response.status).toBe(200)
    expect(greetingResponseSchema.parse(await response.json())).toEqual({
      message: 'Hello, Nata!',
    })
  })

  test('rejects invalid input with a validation error contract', async () => {
    const response = await app.request('/api/greet', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '   ' }),
    })

    expect(response.status).toBe(400)
    expect(apiErrorResponseSchema.parse(await response.json())).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
    })
  })

  test('rejects requests without a body', async () => {
    const response = await app.request('/api/greet', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    })

    expect(response.status).toBe(400)
    expect(apiErrorResponseSchema.parse(await response.json())).toMatchObject({
      error: { code: 'BAD_REQUEST' },
    })
  })

  test('rejects malformed JSON with a shared error contract', async () => {
    const response = await app.request('/api/greet', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{',
    })

    expect(response.status).toBe(400)
    expect(apiErrorResponseSchema.parse(await response.json())).toMatchObject({
      error: { code: 'BAD_REQUEST' },
    })
  })

  test('rejects requests above the configured body size from Content-Length', async () => {
    const response = await app.request('/api/greet', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': '1025',
      },
      body: JSON.stringify({ name: 'Nata' }),
    })

    expect(response.status).toBe(413)
    expect(apiErrorResponseSchema.parse(await response.json())).toMatchObject({
      error: { code: 'PAYLOAD_TOO_LARGE' },
    })
  })

  test('rejects oversized request bodies when Content-Length is absent', async () => {
    const response = await app.request('/api/greet', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'a'.repeat(1100) }),
    })

    expect(response.status).toBe(413)
    expect(apiErrorResponseSchema.parse(await response.json())).toMatchObject({
      error: { code: 'PAYLOAD_TOO_LARGE' },
    })
  })

  test('returns a shared JSON error contract for unknown API routes', async () => {
    const response = await app.request('/api/unknown')

    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(apiErrorResponseSchema.parse(await response.json())).toMatchObject({
      error: { code: 'NOT_FOUND' },
    })
  })
})
