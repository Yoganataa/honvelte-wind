export type TraceAttributeValue = string | number | boolean
export type TraceAttributes = Readonly<Record<string, TraceAttributeValue>>

export type TraceContextCarrier = {
  traceparent?: string
  tracestate?: string
}

export type TraceSpanKind = 'server' | 'consumer' | 'internal'
export type TraceSpanStatus = 'ok' | 'error'

export type TraceSpanOptions = {
  kind?: TraceSpanKind
  attributes?: TraceAttributes
  parent?: TraceContextCarrier
}

export type TraceSpan = {
  readonly traceId?: string
  readonly spanId?: string
  setAttribute(key: string, value: TraceAttributeValue): void
  setAttributes(attributes: TraceAttributes): void
  recordError(error: unknown): void
  setStatus(status: TraceSpanStatus): void
}

/**
 * Small provider-neutral tracing boundary. Implementations own context storage,
 * propagation, sampling, span processors, and exporting.
 */
export type Tracing = {
  withSpan<T>(
    name: string,
    options: TraceSpanOptions,
    callback: (span: TraceSpan) => Promise<T>,
  ): Promise<T>
  inject(carrier?: TraceContextCarrier): TraceContextCarrier
}

const noopSpan: TraceSpan = {
  setAttribute: () => {},
  setAttributes: () => {},
  recordError: () => {},
  setStatus: () => {},
}

export const noopTracing: Tracing = {
  async withSpan(_name, _options, callback) {
    return callback(noopSpan)
  },
  inject(carrier = {}) {
    return { ...carrier }
  },
}

const TRACEPARENT_PATTERN =
  /^(?!ff-)[\da-f]{2}-[\da-f]{32}-[\da-f]{16}-[\da-f]{2}$/i

/**
 * Accept only bounded W3C trace headers before they enter a job envelope.
 * Baggage is deliberately excluded to avoid propagating arbitrary user data.
 */
export function validateTraceContextCarrier(
  value: unknown,
): TraceContextCarrier | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined
  }

  const input = value as Record<string, unknown>
  const traceparent =
    typeof input.traceparent === 'string' &&
    input.traceparent.length <= 55 &&
    TRACEPARENT_PATTERN.test(input.traceparent) &&
    !/^0{2}-0{32}-0{16}-/i.test(input.traceparent)
      ? input.traceparent
      : undefined
  const tracestate =
    typeof input.tracestate === 'string' &&
    input.tracestate.length > 0 &&
    input.tracestate.length <= 512 &&
    /^[\x20-\x7e]+$/.test(input.tracestate)
      ? input.tracestate
      : undefined

  if (!traceparent && !tracestate) return undefined

  return {
    ...(traceparent ? { traceparent } : {}),
    ...(tracestate ? { tracestate } : {}),
  }
}
