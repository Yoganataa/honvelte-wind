export type HttpRequestMetric = {
  method: string
  route: string
  statusCode: number
  durationSeconds: number
}

export type HttpMetrics = {
  beginRequest(): void
  endRequest(): void
  recordRequest(metric: HttpRequestMetric): void
  renderPrometheus(): string
}

type RequestSeries = {
  method: string
  route: string
  statusCode: number
  count: number
  errorCount: number
  durationSumSeconds: number
  bucketCounts: number[]
}

const HTTP_METHODS = new Set([
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
  'QUERY',
])

const DURATION_BUCKETS_SECONDS = [
  0.005,
  0.01,
  0.025,
  0.05,
  0.075,
  0.1,
  0.25,
  0.5,
  0.75,
  1,
  2.5,
  5,
  7.5,
  10,
] as const

const MAX_SERIES = 250
const OVERFLOW_SERIES_KEY = '_OTHER\u0000__overflow__\u00000'

function normalizeMethod(method: string): string {
  const normalized = method.toUpperCase()
  return HTTP_METHODS.has(normalized) ? normalized : '_OTHER'
}

function normalizeRoute(route: string): string {
  if (!route.startsWith('/') || route.length > 160) return '__other__'
  return route
}

function normalizeStatus(statusCode: number): number {
  return Number.isInteger(statusCode) && statusCode >= 100 && statusCode <= 599
    ? statusCode
    : 500
}

function escapeLabel(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"')
}

function formatLabels(series: RequestSeries): string {
  return `method="${escapeLabel(series.method)}",route="${escapeLabel(series.route)}",status_code="${series.statusCode}"`
}

function createSeries(
  method: string,
  route: string,
  statusCode: number,
): RequestSeries {
  return {
    method,
    route,
    statusCode,
    count: 0,
    errorCount: 0,
    durationSumSeconds: 0,
    bucketCounts: Array.from({ length: DURATION_BUCKETS_SECONDS.length }, () => 0),
  }
}

export function createHttpMetrics(): HttpMetrics {
  const series = new Map<string, RequestSeries>()
  let activeRequests = 0

  return {
    beginRequest() {
      activeRequests += 1
    },

    endRequest() {
      activeRequests = Math.max(0, activeRequests - 1)
    },

    recordRequest(metric) {
      const method = normalizeMethod(metric.method)
      const route = normalizeRoute(metric.route)
      const statusCode = normalizeStatus(metric.statusCode)
      const key = `${method}\u0000${route}\u0000${statusCode}`

      let current = series.get(key)

      if (!current && series.size >= MAX_SERIES) {
        current = series.get(OVERFLOW_SERIES_KEY)
        if (!current) {
          current = createSeries('_OTHER', '__overflow__', 0)
          series.set(OVERFLOW_SERIES_KEY, current)
        }
      }

      if (!current) {
        current = createSeries(method, route, statusCode)
        series.set(key, current)
      }

      const durationSeconds =
        Number.isFinite(metric.durationSeconds) && metric.durationSeconds >= 0
          ? metric.durationSeconds
          : 0

      current.count += 1
      if (statusCode >= 500) current.errorCount += 1
      current.durationSumSeconds += durationSeconds

      for (let index = 0; index < DURATION_BUCKETS_SECONDS.length; index += 1) {
        if (durationSeconds <= DURATION_BUCKETS_SECONDS[index]) {
          current.bucketCounts[index] += 1
        }
      }
    },

    renderPrometheus() {
      const lines = [
        '# HELP http_server_active_requests Number of HTTP requests currently being handled.',
        '# TYPE http_server_active_requests gauge',
        `http_server_active_requests ${activeRequests}`,
        '# HELP http_server_requests_total Total number of completed HTTP server requests.',
        '# TYPE http_server_requests_total counter',
      ]

      for (const current of series.values()) {
        lines.push(
          `http_server_requests_total{${formatLabels(current)}} ${current.count}`,
        )
      }

      lines.push(
        '# HELP http_server_request_errors_total Total number of HTTP server requests with 5xx responses.',
        '# TYPE http_server_request_errors_total counter',
      )

      for (const current of series.values()) {
        if (current.errorCount > 0) {
          lines.push(
            `http_server_request_errors_total{${formatLabels(current)}} ${current.errorCount}`,
          )
        }
      }

      lines.push(
        '# HELP http_server_request_duration_seconds HTTP server request duration in seconds.',
        '# TYPE http_server_request_duration_seconds histogram',
      )

      for (const current of series.values()) {
        const labels = formatLabels(current)

        for (let index = 0; index < DURATION_BUCKETS_SECONDS.length; index += 1) {
          lines.push(
            `http_server_request_duration_seconds_bucket{${labels},le="${DURATION_BUCKETS_SECONDS[index]}"} ${current.bucketCounts[index]}`,
          )
        }

        lines.push(
          `http_server_request_duration_seconds_bucket{${labels},le="+Inf"} ${current.count}`,
          `http_server_request_duration_seconds_sum{${labels}} ${current.durationSumSeconds}`,
          `http_server_request_duration_seconds_count{${labels}} ${current.count}`,
        )
      }

      return `${lines.join('\n')}\n`
    },
  }
}

export function createNoopHttpMetrics(): HttpMetrics {
  return {
    beginRequest: () => {},
    endRequest: () => {},
    recordRequest: () => {},
    renderPrometheus: () => '',
  }
}
