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

  test('returns a greeting for valid input', async () => {
    const response = await app.request('/api/greet', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Nata' }),
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ message: 'Hello, Nata!' })
  })

  test('rejects invalid input with a validation error', async () => {
    const response = await app.request('/api/greet', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '   ' }),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
    })
  })

  test('rejects malformed JSON', async () => {
    const response = await app.request('/api/greet', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{',
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({
      error: { code: 'BAD_REQUEST' },
    })
  })

  test('rejects requests above the configured body size', async () => {
    const response = await app.request('/api/greet', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': '1025',
      },
      body: JSON.stringify({ name: 'Nata' }),
    })

    expect(response.status).toBe(413)
    expect(await response.json()).toMatchObject({
      error: { code: 'PAYLOAD_TOO_LARGE' },
    })
  })

  test('returns a JSON 404 for unknown API routes', async () => {
    const response = await app.request('/api/unknown')

    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toContain('application/json')
  })
})
