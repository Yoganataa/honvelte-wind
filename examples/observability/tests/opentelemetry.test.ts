import { describe, expect, test } from 'bun:test'
import type { Span, Tracer } from '@opentelemetry/api'
import {
  createOpenTelemetryTracing,
  validateOpenTelemetryTracingOptions,
} from '../src/opentelemetry'

function createFakeSpan(
  attributes: Record<string, unknown>,
  events: Array<{ name: string; attributes?: Record<string, unknown> }>,
  statuses: string[],
): Span {
  return {
    spanContext: () => ({
      traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
      spanId: '00f067aa0ba902b7',
      traceFlags: 1,
    }),
    setAttribute(key, value) {
      attributes[key] = value
      return this
    },
    setAttributes(values) {
      Object.assign(attributes, values)
      return this
    },
    addEvent(name, values) {
      events.push({ name, attributes: values })
      return this
    },
    setStatus(status) {
      statuses.push(String(status.code))
      return this
    },
    end() {},
    isRecording: () => true,
    updateName() {
      return this
    },
    recordException() {},
    addLink() {
      return this
    },
    addLinks() {
      return this
    },
    spanContext: () => ({
      traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
      spanId: '00f067aa0ba902b7',
      traceFlags: 1,
    }),
    spanContext: () => ({
      traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
      spanId: '00f067aa0ba902b7',
      traceFlags: 1,
    }),
  } as unknown as Span
}

describe('OpenTelemetry tracing adapter', () => {
  test('adapts spans and records only exception type', async () => {
    const attributes: Record<string, unknown> = {}
    const events: Array<{ name: string; attributes?: Record<string, unknown> }> = []
    const statuses: string[] = []
    const names: string[] = []
    const fakeSpan = createFakeSpan(attributes, events, statuses)
    const tracer = {
      startActiveSpan(name, _options, callback) {
        names.push(name)
        return callback(fakeSpan)
      },
    } as unknown as Tracer
    const tracing = createOpenTelemetryTracing(tracer)

    const result = await tracing.withSpan(
      'http.server.request',
      {
        kind: 'server',
        attributes: { 'http.request.method': 'GET' },
      },
      async (span) => {
        expect(span.traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736')
        expect(span.spanId).toBe('00f067aa0ba902b7')
        span.setAttribute('http.route', '/api/health')
        return 200
      },
    )

    expect(result).toBe(200)
    expect(names).toEqual(['http.server.request'])
    expect(attributes).toMatchObject({
      'http.request.method': 'GET',
      'http.route': '/api/health',
    })

    await expect(
      tracing.withSpan('background.job.execute', {}, async () => {
        throw new TypeError('secret message must not leave this process')
      }),
    ).rejects.toThrow('secret message must not leave this process')

    expect(attributes['exception.type']).toBe('TypeError')
    expect(events).toEqual([
      { name: 'exception', attributes: { 'exception.type': 'TypeError' } },
    ])
    expect(statuses).toContain('2')
    expect(JSON.stringify({ attributes, events })).not.toContain('secret message')
  })

  test('requires a valid HTTPS OTLP signal endpoint', () => {
    expect(() =>
      validateOpenTelemetryTracingOptions({
        serviceName: 'honvelte-wind-api',
        endpoint: 'http://telemetry.example/v1/traces',
      }),
    ).toThrow()

    expect(() =>
      validateOpenTelemetryTracingOptions({
        serviceName: 'honvelte-wind-api',
        endpoint: 'https://telemetry.example/v1/traces',
        sampleRate: 1.1,
      }),
    ).toThrow()

    expect(
      validateOpenTelemetryTracingOptions({
        serviceName: 'honvelte-wind-api',
        endpoint: 'https://telemetry.example/v1/traces',
      }),
    ).toMatchObject({
      serviceName: 'honvelte-wind-api',
      sampleRate: 0.1,
    })
  })

  test('allows insecure OTLP HTTP only on loopback development endpoints', () => {
    expect(
      validateOpenTelemetryTracingOptions({
        serviceName: 'honvelte-wind-api',
        endpoint: 'http://127.0.0.1:4318/v1/traces',
      }).endpoint,
    ).toBe('http://127.0.0.1:4318/v1/traces')

    expect(() =>
      validateOpenTelemetryTracingOptions({
        serviceName: 'honvelte-wind-api',
        endpoint: 'http://collector.example/v1/traces',
      }),
    ).toThrow()
  })
})
