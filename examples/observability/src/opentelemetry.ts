import {
  context,
  propagation,
  SpanKind,
  SpanStatusCode,
  trace,
  type Span,
  type Tracer,
} from '@opentelemetry/api'
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks'
import { W3CTraceContextPropagator } from '@opentelemetry/core'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import {
  BatchSpanProcessor,
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
  TracerProvider,
} from '@opentelemetry/sdk-trace'
import {
  validateTraceContextCarrier,
  type TraceAttributeValue,
  type TraceAttributes,
  type TraceContextCarrier,
  type TraceSpan,
  type TraceSpanKind,
  type TraceSpanOptions,
  type TraceSpanStatus,
  type Tracing,
} from '../../../packages/contracts/src/tracing'

export type OpenTelemetryTracingOptions = {
  serviceName: string
  endpoint: string
  headers?: Record<string, string>
  sampleRate?: number
  timeoutMillis?: number
}

export type ConfiguredOpenTelemetryTracing = {
  tracing: Tracing
  forceFlush(): Promise<void>
  shutdown(): Promise<void>
}

const spanKinds: Record<TraceSpanKind, SpanKind> = {
  server: SpanKind.SERVER,
  consumer: SpanKind.CONSUMER,
  internal: SpanKind.INTERNAL,
}

function safeErrorType(error: unknown): string {
  if (error instanceof Error && error.name) return error.name.slice(0, 128)
  return typeof error
}

/**
 * Validate configuration without opening sockets or registering global SDK state.
 * The OTLP HTTP exporter expects the complete signal endpoint ending in /v1/traces.
 */
export function validateOpenTelemetryTracingOptions(
  options: OpenTelemetryTracingOptions,
): Required<Pick<OpenTelemetryTracingOptions, 'serviceName' | 'endpoint' | 'sampleRate'>> &
  Pick<OpenTelemetryTracingOptions, 'headers' | 'timeoutMillis'> {
  const serviceName = options.serviceName.trim()
  if (!serviceName || serviceName.length > 128) {
    throw new TypeError('serviceName must contain between 1 and 128 characters.')
  }

  let endpoint: URL
  try {
    endpoint = new URL(options.endpoint)
  } catch {
    throw new TypeError('endpoint must be a valid absolute URL.')
  }

  const isLoopback =
    endpoint.hostname === 'localhost' ||
    endpoint.hostname === '127.0.0.1' ||
    endpoint.hostname === '[::1]'
  if (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && isLoopback)) {
    throw new TypeError('OTLP endpoints must use HTTPS, except for loopback development.')
  }
  if (
    endpoint.username ||
    endpoint.password ||
    endpoint.search ||
    endpoint.hash ||
    !endpoint.pathname.endsWith('/v1/traces')
  ) {
    throw new TypeError('endpoint must be a clean URL ending in /v1/traces.')
  }

  const sampleRate = options.sampleRate ?? 0.1
  if (!Number.isFinite(sampleRate) || sampleRate < 0 || sampleRate > 1) {
    throw new RangeError('sampleRate must be a finite number between 0 and 1.')
  }

  if (options.timeoutMillis !== undefined &&
      (!Number.isSafeInteger(options.timeoutMillis) || options.timeoutMillis < 1000 || options.timeoutMillis > 120_000)) {
    throw new RangeError('timeoutMillis must be an integer between 1000 and 120000.')
  }

  const headers = options.headers ? { ...options.headers } : undefined
  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      if (
        !/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(key) ||
        typeof value !== 'string' ||
        /[\r\n]/.test(value) ||
        value.length > 4096
      ) {
        throw new TypeError('OTLP headers must have valid names and bounded single-line values.')
      }
    }
  }

  return {
    serviceName,
    endpoint: endpoint.toString(),
    sampleRate,
    ...(headers ? { headers } : {}),
    ...(options.timeoutMillis ? { timeoutMillis: options.timeoutMillis } : {}),
  }
}

/**
 * Adapt a registered OpenTelemetry tracer to the starter's provider-neutral
 * contract. Error events intentionally contain only exception.type; messages,
 * stack traces, request content, and job payloads are not exported.
 */
export function createOpenTelemetryTracing(
  tracer: Tracer = trace.getTracer('honvelte-wind'),
): Tracing {
  return {
    async withSpan<T>(
      name: string,
      options: TraceSpanOptions,
      callback: (span: TraceSpan) => Promise<T>,
    ): Promise<T> {
      const parentCarrier = options.parent
        ? validateTraceContextCarrier(options.parent)
        : undefined
      const parentContext = parentCarrier
        ? propagation.extract(context.active(), parentCarrier)
        : context.active()

      return context.with(parentContext, () =>
        tracer.startActiveSpan(
          name,
          {
            kind: options.kind ? spanKinds[options.kind] : SpanKind.INTERNAL,
            attributes: options.attributes,
          },
          async (activeSpan) => {
            const span = createSpanView(activeSpan)
            try {
              return await callback(span)
            } catch (error) {
              span.recordError(error)
              throw error
            } finally {
              activeSpan.end()
            }
          },
        ),
      )
    },

    inject(carrier: TraceContextCarrier = {}) {
      const output: Record<string, string> = {
        ...(carrier.traceparent ? { traceparent: carrier.traceparent } : {}),
        ...(carrier.tracestate ? { tracestate: carrier.tracestate } : {}),
      }
      propagation.inject(context.active(), output)
      return validateTraceContextCarrier(output) ?? {}
    },
  }
}

function createSpanView(activeSpan: Span): TraceSpan {
  const spanContext = activeSpan.spanContext()

  return {
    ...(spanContext.traceId ? { traceId: spanContext.traceId } : {}),
    ...(spanContext.spanId ? { spanId: spanContext.spanId } : {}),
    setAttribute(key: string, value: TraceAttributeValue) {
      activeSpan.setAttribute(key, value)
    },
    setAttributes(attributes: TraceAttributes) {
      activeSpan.setAttributes({ ...attributes })
    },
    recordError(error: unknown) {
      const exceptionType = safeErrorType(error)
      activeSpan.setAttribute('exception.type', exceptionType)
      activeSpan.addEvent('exception', { 'exception.type': exceptionType })
      activeSpan.setStatus({ code: SpanStatusCode.ERROR })
    },
    setStatus(status: TraceSpanStatus) {
      activeSpan.setStatus({
        code: status === 'error' ? SpanStatusCode.ERROR : SpanStatusCode.OK,
      })
    },
  }
}

/**
 * Configure one process-wide OTel SDK instance. Call once during Bun startup,
 * before creating the Hono application. Always invoke shutdown() on termination.
 */
export function configureOpenTelemetryTracing(
  input: OpenTelemetryTracingOptions,
): ConfiguredOpenTelemetryTracing {
  const options = validateOpenTelemetryTracingOptions(input)
  const exporter = new OTLPTraceExporter({
    url: options.endpoint,
    ...(options.headers ? { headers: options.headers } : {}),
    ...(options.timeoutMillis ? { timeoutMillis: options.timeoutMillis } : {}),
    concurrencyLimit: 4,
  })
  const provider = new TracerProvider({
    resource: resourceFromAttributes({
      'service.name': options.serviceName,
    }),
    sampler: new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(options.sampleRate),
    }),
    spanProcessors: [
      new BatchSpanProcessor({
        exporter,
        maxQueueSize: 2048,
        maxExportBatchSize: 256,
        scheduledDelayMillis: 5_000,
        exportTimeoutMillis: options.timeoutMillis ?? 30_000,
      }),
    ],
  })

  const contextManager = new AsyncLocalStorageContextManager().enable()
  if (!context.setGlobalContextManager(contextManager)) {
    contextManager.disable()
    throw new Error(
      'An OpenTelemetry context manager is already registered. Configure tracing once during process startup.',
    )
  }

  if (!propagation.setGlobalPropagator(new W3CTraceContextPropagator())) {
    context.disable()
    throw new Error(
      'An OpenTelemetry propagator is already registered. Configure tracing once during process startup.',
    )
  }

  if (!trace.setGlobalTracerProvider(provider)) {
    context.disable()
    void provider.shutdown()
    throw new Error(
      'An OpenTelemetry tracer provider is already registered. Configure tracing once during process startup.',
    )
  }

  return {
    tracing: createOpenTelemetryTracing(provider.getTracer(options.serviceName)),
    forceFlush: () => provider.forceFlush(),
    async shutdown() {
      try {
        await provider.shutdown()
      } finally {
        contextManager.disable()
      }
    },
  }
}
