import type {
  TraceAttributes,
  TraceContextCarrier,
  TraceSpan,
  TraceSpanOptions,
  TraceSpanStatus,
  Tracing,
} from '@honvelte/contracts'

export type CloudflareNativeSpan = {
  setAttribute(
    key: string,
    value: string | number | boolean,
  ): unknown
  setAttributes(
    attributes: Record<string, string | number | boolean | undefined>,
  ): unknown
  setStatus(status: { code: 'unset' | 'ok' | 'error' }): unknown
  spanContext(): {
    traceId: string
    spanId: string
    traceFlags: number
  }
}

export type CloudflareNativeTracing = {
  enterSpan<T>(
    name: string,
    callback: (span: CloudflareNativeSpan) => Promise<T>,
  ): Promise<T>
}

const ZERO_TRACE_ID = '00000000000000000000000000000000'
const ZERO_SPAN_ID = '0000000000000000'

function errorType(error: unknown): string {
  if (error instanceof Error && error.name) return error.name.slice(0, 128)
  return typeof error
}

/**
 * Adapts Cloudflare's native custom spans API. Parent-child relationships are
 * supplied by the Worker's active async context; this adapter deliberately does
 * not synthesize traceparent values from traceFlags.
 */
export function createCloudflareTracing(
  nativeTracing: CloudflareNativeTracing,
): Tracing {
  return {
    async withSpan<T>(
      name: string,
      options: TraceSpanOptions,
      callback: (span: TraceSpan) => Promise<T>,
    ): Promise<T> {
      return nativeTracing.enterSpan(name, async (nativeSpan) => {
        const context = nativeSpan.spanContext()
        const traceId =
          context.traceId !== ZERO_TRACE_ID ? context.traceId : undefined
        const spanId =
          context.spanId !== ZERO_SPAN_ID ? context.spanId : undefined

        const span: TraceSpan = {
          ...(traceId ? { traceId } : {}),
          ...(spanId ? { spanId } : {}),
          setAttribute(key, value) {
            nativeSpan.setAttribute(key, value)
          },
          setAttributes(attributes: TraceAttributes) {
            nativeSpan.setAttributes({ ...attributes })
          },
          recordError(error) {
            nativeSpan.setAttribute('exception.type', errorType(error))
            nativeSpan.setStatus({ code: 'error' })
          },
          setStatus(status: TraceSpanStatus) {
            nativeSpan.setStatus({ code: status })
          },
        }

        if (options.kind) {
          nativeSpan.setAttribute('app.span.kind', options.kind)
        }
        if (options.attributes) {
          nativeSpan.setAttributes(options.attributes)
        }

        try {
          return await callback(span)
        } catch (error) {
          span.recordError(error)
          throw error
        }
      })
    },

    inject(carrier: TraceContextCarrier = {}) {
      // Cloudflare owns propagation for platform spans. Its public custom-span
      // API does not expose a supported way to create a W3C traceparent header.
      return { ...carrier }
    },
  }
}
