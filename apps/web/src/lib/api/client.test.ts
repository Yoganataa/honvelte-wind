import { describe, expect, test } from 'bun:test'
import {
  ApiClientError,
  createApiClient,
} from './client'

describe('typed API client', () => {
  test('validates and returns the shared health response contract', async () => {
    let requestedUrl = ''
    let requestedInit: RequestInit | undefined
    const client = createApiClient(async (input, init) => {
      requestedUrl = String(input)
      requestedInit = init

      return Response.json({
        status: 'ok',
        timestamp: '2026-10-31T12:00:00.000Z',
      })
    })

    const health = await client.health()

    expect(health.status).toBe('ok')
    expect(requestedUrl).toBe('/api/health')
    expect(requestedInit?.method).toBe('GET')
    expect(requestedInit?.credentials).toBe('same-origin')
    expect(new Headers(requestedInit?.headers).get('accept')).toBe(
      'application/json',
    )
  })

  test('normalizes greeting input and sends the typed same-origin request', async () => {
    let requestedUrl = ''
    let requestedInit: RequestInit | undefined
    const client = createApiClient(async (input, init) => {
      requestedUrl = String(input)
      requestedInit = init
      return Response.json({ message: 'Hello, Nata!' })
    })

    const result = await client.greet({ name: '  Nata  ' })

    expect(result).toEqual({ message: 'Hello, Nata!' })
    expect(requestedUrl).toBe('/api/greet')
    expect(requestedInit?.method).toBe('POST')
    expect(requestedInit?.credentials).toBe('same-origin')
    expect(JSON.parse(String(requestedInit?.body))).toEqual({ name: 'Nata' })
    expect(new Headers(requestedInit?.headers).get('content-type')).toBe(
      'application/json',
    )
  })

  test('validates input before making a network request', async () => {
    let fetchCalled = false
    const client = createApiClient(async () => {
      fetchCalled = true
      return Response.json({ message: 'unexpected' })
    })

    expect(() => client.greet({ name: ' ' })).toThrow(ApiClientError)
    expect(fetchCalled).toBe(false)
  })

  test('forwards the caller AbortSignal to the same-origin request', async () => {
    const controller = new AbortController()
    let receivedSignal: AbortSignal | null | undefined
    const client = createApiClient(async (_input, init) => {
      receivedSignal = init?.signal
      return Response.json({
        status: 'ok',
        timestamp: '2026-10-31T12:00:00.000Z',
      })
    })

    await client.health({ signal: controller.signal })

    expect(receivedSignal).toBe(controller.signal)
  })

  test('preserves structured API errors, status, and request ID', async () => {
    const client = createApiClient(async () =>
      Response.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Try again later.',
          },
        },
        {
          status: 429,
          headers: { 'x-request-id': 'request-429' },
        },
      ),
    )

    try {
      await client.health()
      throw new Error('Expected API client to reject the response.')
    } catch (cause) {
      expect(cause).toBeInstanceOf(ApiClientError)
      expect(cause).toMatchObject({
        message: 'Too many requests. Try again later.',
        status: 429,
        code: 'RATE_LIMITED',
        requestId: 'request-429',
      })
    }
  })

  test('preserves rate-limit unavailable and gateway-timeout error contracts', async () => {
    for (const [status, code] of [
      [503, 'RATE_LIMIT_UNAVAILABLE'],
      [504, 'GATEWAY_TIMEOUT'],
    ] as const) {
      const client = createApiClient(async () =>
        Response.json(
          {
            error: {
              code,
              message: 'The request could not be completed.',
            },
          },
          { status },
        ),
      )

      await expect(client.health()).rejects.toMatchObject({
        status,
        code,
        message: 'The request could not be completed.',
      })
    }
  })

  test('uses a stable fallback when an HTTP error body is not a known contract', async () => {
    const client = createApiClient(async () =>
      Response.json(
        { error: 'upstream exploded' },
        {
          status: 502,
          headers: { 'x-request-id': 'request-502' },
        },
      ),
    )

    await expect(client.health()).rejects.toMatchObject({
      message: 'API request failed with status 502.',
      status: 502,
      requestId: 'request-502',
      code: undefined,
    })
  })

  test('rejects malformed JSON and invalid success payloads', async () => {
    const malformedJsonClient = createApiClient(async () =>
      new Response('{', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    const invalidPayloadClient = createApiClient(async () =>
      Response.json({ status: 'degraded', timestamp: 'not-a-date' }),
    )

    await expect(malformedJsonClient.health()).rejects.toMatchObject({
      message: 'API returned invalid JSON.',
      status: 200,
    })
    await expect(invalidPayloadClient.health()).rejects.toMatchObject({
      message: 'API returned an invalid response.',
      status: 200,
    })
  })

  test('preserves abort and timeout errors from the fetch implementation', async () => {
    const abortError = new DOMException('Request aborted.', 'AbortError')
    const timeoutError = new DOMException('Timed out.', 'TimeoutError')
    const abortClient = createApiClient(async () => {
      throw abortError
    })
    const timeoutClient = createApiClient(async () => {
      throw timeoutError
    })

    await expect(abortClient.health()).rejects.toBe(abortError)
    await expect(timeoutClient.health()).rejects.toBe(timeoutError)
  })

  test('wraps network failures with a typed API client error', async () => {
    const networkClient = createApiClient(async () => {
      throw new TypeError('socket unavailable')
    })

    await expect(networkClient.health()).rejects.toMatchObject({
      message: 'Unable to reach the API.',
      status: undefined,
      code: undefined,
    })
  })
})
