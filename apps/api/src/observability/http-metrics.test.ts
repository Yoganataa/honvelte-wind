import { describe, expect, test } from 'bun:test'
import { createHttpMetrics } from './http-metrics'

describe('HTTP metrics', () => {
  test('tracks request counts, errors, active requests, and durations', () => {
    const metrics = createHttpMetrics()

    metrics.beginRequest()
    metrics.beginRequest()
    expect(metrics.renderPrometheus()).toContain('route="/quoted/\\"route\\""')

    metrics.recordRequest({
      method: 'GET',
      route: '/api/health',
      statusCode: 200,
      durationSeconds: 0.008,
    })
    metrics.endRequest()

    metrics.recordRequest({
      method: 'POST',
      route: '/api/greet',
      statusCode: 500,
      durationSeconds: 0.3,
    })
    metrics.endRequest()

    const output = metrics.renderPrometheus()

    expect(output).toContain('http_server_active_requests 0')
    expect(output).toContain(
      'http_server_requests_total{method="GET",route="/api/health",status_code="200"} 1',
    )
    expect(output).toContain(
      'http_server_request_errors_total{method="POST",route="/api/greet",status_code="500"} 1',
    )
    expect(output).toContain(
      'http_server_request_duration_seconds_bucket{method="GET",route="/api/health",status_code="200",le="0.01"} 1',
    )
    expect(output).toContain(
      'http_server_request_duration_seconds_count{method="POST",route="/api/greet",status_code="500"} 1',
    )
  })

  test('normalizes unrecognized metric labels and status values', () => {
    const metrics = createHttpMetrics()
    metrics.recordRequest({
      method: 'CUSTOM-CLIENT-METHOD',
      route: 'untrusted-route',
      statusCode: 999,
      durationSeconds: Number.NaN,
    })

    const output = metrics.renderPrometheus()

    expect(output).toContain(
      'http_server_requests_total{method="_OTHER",route="__other__",status_code="500"} 1',
    )
  })

  test('escapes route labels for valid route templates', () => {
    const metrics = createHttpMetrics()
    metrics.recordRequest({
      method: 'GET',
      route: '/quoted/"route"',
      statusCode: 200,
      durationSeconds: 0.001,
    })

    expect(metrics.renderPrometheus()).toContain(
      'route="/quoted/\\"route\\""',
    )
  })

  test('bounds the number of exported time series', () => {
    const metrics = createHttpMetrics()

    for (let index = 0; index < 300; index += 1) {
      metrics.recordRequest({
        method: 'GET',
        route: `/route-${index}`,
        statusCode: 200,
        durationSeconds: 0.01,
      })
    }

    const output = metrics.renderPrometheus()

    expect(output.match(/^http_server_requests_total\{/gm)).toHaveLength(250)
    expect(output).toContain('route="__overflow__"')
  })
})
