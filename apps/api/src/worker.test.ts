import {
  API_BASE_PATH,
  apiPaths,
  greetingResponseSchema,
  healthResponseSchema,
} from '@honvelte/contracts'
import { describe, expect, test } from 'bun:test'
import worker from './worker'

describe('Cloudflare Workers adapter', () => {
  test('serves liveness through the standard Fetch API', async () => {
    const response = await worker.fetch(
      new Request(`https://example.test${API_BASE_PATH}${apiPaths.health}`),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(healthResponseSchema.parse(await response.json()).status).toBe('ok')
  })

  test('preserves validated request correlation IDs', async () => {
    const response = await worker.fetch(
      new Request(`https://example.test${API_BASE_PATH}${apiPaths.health}`, {
        headers: { 'x-request-id': 'worker-adapter-test-123' },
      }),
    )

    expect(response.headers.get('x-request-id')).toBe('worker-adapter-test-123')
  })

  test('serves application routes through the Worker boundary', async () => {
    const response = await worker.fetch(
      new Request(`https://example.test${API_BASE_PATH}${apiPaths.greet}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Worker' }),
      }),
    )

    expect(response.status).toBe(200)
    expect(greetingResponseSchema.parse(await response.json())).toEqual({
      message: 'Hello, Worker!',
    })
  })

  test('returns a shared 404 contract for unknown API routes', async () => {
    const response = await worker.fetch(
      new Request(`https://example.test${API_BASE_PATH}/unknown`),
    )

    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(await response.json()).toMatchObject({
      error: { code: 'NOT_FOUND' },
    })
  })

  test('does not take ownership of static routes', async () => {
    const response = await worker.fetch(new Request('https://example.test/'))

    expect(response.status).toBe(404)
  })
})
