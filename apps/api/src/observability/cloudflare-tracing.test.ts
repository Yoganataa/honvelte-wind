import { describe, expect, test } from 'bun:test'
import {
  createCloudflareTracing,
  type CloudflareNativeSpan,
} from './cloudflare-tracing'

function createNativeSpan(attributes: Record<string, unknown>, statuses: string[]) {
  const context = {
    traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
    spanId: '00f067aa0ba902b7',
    traceFlags: 0,
  }

  const span: CloudflareNativeSpan = {
    setAttribute(key, value) {
      attributes[key] = value
    },
    setAttributes(values) {
      Object.assign(attributes, values)
    },
    setStatus(status) {
      statuses.push(status.code)
    },
    spanContext() {
      return context
    },
  }

  return span
}

describe('Cloudflare native tracing adapter', () => {
  test('records safe attributes and exposes trace correlation IDs', async () => {
    const attributes: Record<string, unknown> = {}
    const statuses: string[] = []
    const nativeSpan = createNativeSpan(attributes, statuses)
    const names: string[] = []
    const tracing = createCloudflareTracing({
      async enterSpan(name, callback) {
        names.push(name)
        return callback(nativeSpan)
      },
    })

    const result = await tracing.withSpan(
      'http.server.request',
      {
        kind: 'server',
        attributes: { 'http.request.method': 'GET' },
      },
      async (span) => {
        expect(span.traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736')
        expect(span.spanId).toBe('00f067aa0ba902b7')
        span.setAttribute('http.response.status_code', 200)
        return 'response'
      },
    )

    expect(result).toBe('response')
    expect(names).toEqual(['http.server.request'])
    expect(attributes).toMatchObject({
      'app.span.kind': 'server',
      'http.request.method': 'GET',
      'http.response.status_code': 200,
    })
    expect(statuses).toEqual([])
  })

  test('records only the error type, never the error message or stack', async () => {
    const attributes: Record<string, unknown> = {}
    const statuses: string[] = []
    const tracing = createCloudflareTracing({
      async enterSpan(_name, callback) {
        return callback(createNativeSpan(attributes, statuses))
      },
    })
    const secret = 'private-error-message'

    await expect(
      tracing.withSpan('background.job.execute', {}, async (span) => {
        span.recordError(new Error(secret))
        throw new TypeError(secret)
      }),
    ).rejects.toThrow(secret)

    expect(attributes['exception.type']).toBe('TypeError')
    expect(JSON.stringify(attributes)).not.toContain(secret)
    expect(statuses).toEqual(['error', 'error'])
  })

  test('does not synthesize traceparent from Cloudflare trace flags', () => {
    const tracing = createCloudflareTracing({
      async enterSpan(_name, callback) {
        return callback(createNativeSpan({}, []))
      },
    })

    expect(tracing.inject({})).toEqual({})
  })

  test('omits placeholder zero IDs when observability is disabled', async () => {
    const tracing = createCloudflareTracing({
      async enterSpan(_name, callback) {
        const span = createNativeSpan({}, [])
        span.spanContext = () => ({
          traceId: '00000000000000000000000000000000',
          spanId: '0000000000000000',
          traceFlags: 0,
        })
        return callback(span)
      },
    })

    await tracing.withSpan('disabled', {}, async (span) => {
      expect(span.traceId).toBeUndefined()
      expect(span.spanId).toBeUndefined()
    })
  })
})
