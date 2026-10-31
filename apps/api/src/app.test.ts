import {
  API_BASE_PATH,
  apiErrorResponseSchema,
  apiPaths,
  greetingResponseSchema,
  healthResponseSchema,
  readinessResponseSchema,
} from '@honvelte/contracts'
import { describe, expect, test } from 'bun:test'
import { createHttpMetrics } from './observability/http-metrics'
import { createLogger, type LogRecord } from './observability/logger'
import app, { createApp } from './app'
import { createRuntimeLifecycle } from './runtime/lifecycle'

describe('API app', () => {
  test('returns a health response with a request ID', async () => {
    const response = await app.request(API_BASE_PATH + apiPaths.health)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('x-request-id')).toBeTruthy()
    expect(healthResponseSchema.parse(body)).toMatchObject({ status: 'ok' })
  })

  test('returns a ready response while accepting requests', async () => {
    const response = await app.request(API_BASE_PATH + apiPaths.ready)

    expect(response.status).toBe(200)
    expect(readinessResponseSchema.parse(await response.json()).status).toBe(
      'ready',
    )
  })

  test('preserves a caller-provided request ID', async () => {
    const response = await app.request(API_BASE_PATH + apiPaths.health, {
      headers: { 'x-request-id': 'request-test-123' },
    })

    expect(response.headers.get('x-request-id')).toBe('request-test-123')
  })

  test('returns a greeting matching the shared response contract', async () => {
    const response = await app.request(API_BASE_PATH + apiPaths.greet, {
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
    const response = await app.request(API_BASE_PATH + '/unknown')

    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(apiErrorResponseSchema.parse(await response.json())).toMatchObject({
      error: { code: 'NOT_FOUND' },
    })
  })

  test('reports draining readiness separately from liveness', async () => {
    const lifecycle = createRuntimeLifecycle()
    const runtimeApp = createApp({ lifecycle })

    lifecycle.beginShutdown()

    const readiness = await runtimeApp.request(API_BASE_PATH + apiPaths.ready)
    const liveness = await runtimeApp.request(API_BASE_PATH + apiPaths.health)

    expect(readiness.status).toBe(503)
    expect(readinessResponseSchema.parse(await readiness.json()).status).toBe(
      'not_ready',
    )
    expect(liveness.status).toBe(200)
  })

  test('rejects new application requests after shutdown begins', async () => {
    const lifecycle = createRuntimeLifecycle()
    const runtimeApp = createApp({ lifecycle })
    lifecycle.beginShutdown()

    const response = await runtimeApp.request(API_BASE_PATH + apiPaths.greet, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Nata' }),
    })

    expect(response.status).toBe(503)
    expect(apiErrorResponseSchema.parse(await response.json())).toMatchObject({
      error: { code: 'SERVICE_UNAVAILABLE' },
    })
  })
  test('replaces invalid inbound request IDs instead of reflecting them', async () => {
    const response = await app.request(API_BASE_PATH + apiPaths.health, {
      headers: { 'x-request-id': 'invalid request id' },
    })

    const requestId = response.headers.get('x-request-id')

    expect(requestId).toBeTruthy()
    expect(requestId).not.toBe('invalid request id')
    expect(requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
  })

  test('keeps the metrics endpoint disabled unless explicitly enabled', async () => {
    const response = await app.request(API_BASE_PATH + apiPaths.metrics)

    expect(response.status).toBe(404)
  })

  test('protects metrics with a bearer token and exports Prometheus text', async () => {
    const metrics = createHttpMetrics()
    metrics.recordRequest({
      method: 'GET',
      route: '/api/health',
      statusCode: 200,
      durationSeconds: 0.02,
    })
    const token = 'm'.repeat(32)
    const metricsApp = createApp({
      metrics,
      metricsEnabled: true,
      metricsToken: token,
    })

    const denied = await metricsApp.request(API_BASE_PATH + apiPaths.metrics)
    expect(denied.status).toBe(401)
    expect(denied.headers.get('www-authenticate')).toBe('Bearer')
    expect(apiErrorResponseSchema.parse(await denied.json())).toMatchObject({
      error: { code: 'UNAUTHORIZED' },
    })

    const accepted = await metricsApp.request(
      API_BASE_PATH + apiPaths.metrics,
      { headers: { authorization: `Bearer ${token}` } },
    )

    expect(accepted.status).toBe(200)
    expect(accepted.headers.get('cache-control')).toBe('no-store')
    expect(accepted.headers.get('content-type')).toContain('text/plain')
    const output = await accepted.text()
    expect(output).toContain('http_server_requests_total')
    expect(output).toContain('http_server_active_requests 0')
    expect(output).not.toContain('route=\"/api/metrics\"')
  })

  test('logs a route template and request ID without query strings', async () => {
    const records: LogRecord[] = []
    const logger = createLogger({
      level: 'debug',
      sink: (record) => records.push(record),
    })
    const metricsApp = createApp({ logger })

    const response = await metricsApp.request(
      `${API_BASE_PATH}${apiPaths.health}?access_token=never-log-this`,
      { headers: { 'x-request-id': 'observability-test-123' } },
    )

    expect(response.status).toBe(200)
    const requestLog = records.find(
      (record) => record.event === 'http.server.request.completed',
    )

    expect(requestLog).toMatchObject({
      level: 'info',
      requestId: 'observability-test-123',
      method: 'GET',
      route: '/api/health',
      statusCode: 200,
    })
    expect(JSON.stringify(records)).not.toContain('never-log-this')
  })

})
