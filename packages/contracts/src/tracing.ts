import { z } from 'zod'
import {
  validateTraceContextCarrier,
  type TraceContextCarrier,
  type Tracing,
} from '@honvelte/contracts'

export const JobEnvelopeSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .max(128)
      .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/),
    type: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[a-z][a-z0-9.-]{0,63}$/),
    payload: z.unknown(),
    createdAt: z.string().datetime(),
    traceContext: z
      .object({
        traceparent: z.string().max(55).optional(),
        tracestate: z.string().max(512).optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((job, context) => {
    if (job.traceContext && !validateTraceContextCarrier(job.traceContext)) {
      context.addIssue({
        code: 'custom',
        path: ['traceContext'],
        message: 'A valid W3C trace context is required.',
      })
    }
    if (!Object.prototype.hasOwnProperty.call(job, 'payload')) {
      context.addIssue({
        code: 'custom',
        path: ['payload'],
        message: 'Job payload is required.',
      })
    }
  })

export type JobEnvelope<TPayload = unknown> = {
  id: string
  type: string
  payload: TPayload
  createdAt: string
  traceContext?: TraceContextCarrier
}

export type NewJob<TPayload> = {
  id: string
  type: string
  payload: TPayload
  createdAt?: string
  traceContext?: TraceContextCarrier
}

/** Create a validated envelope with a stable ID for one unit of business work. */
export function createJob<TPayload>(
  input: NewJob<TPayload>,
): JobEnvelope<TPayload> {
  const envelope = {
    id: input.id,
    type: input.type,
    payload: input.payload,
    createdAt: input.createdAt ?? new Date().toISOString(),
    ...(input.traceContext ? { traceContext: input.traceContext } : {}),
  }

  JobEnvelopeSchema.parse(envelope)
  return envelope
}

/** Repeated delivery of one scheduled occurrence produces the same job ID. */
export function createScheduledJob<TPayload>(
  type: string,
  scheduledTime: number,
  payload: TPayload,
): JobEnvelope<TPayload> {
  if (!Number.isSafeInteger(scheduledTime) || scheduledTime < 0) {
    throw new RangeError('scheduledTime must be a non-negative safe integer.')
  }

  const date = new Date(scheduledTime)
  if (Number.isNaN(date.getTime())) {
    throw new RangeError('scheduledTime must be a valid timestamp.')
  }

  return createJob({
    id: 'schedule:' + type + ':' + String(scheduledTime),
    type,
    payload,
    createdAt: date.toISOString(),
  })
}

/**
 * Capture the active trace context when publishing work so a consumer with
 * W3C propagation support can continue the same distributed trace.
 */
export function withJobTraceContext<TPayload>(
  job: JobEnvelope<TPayload>,
  tracing: Tracing,
): JobEnvelope<TPayload> {
  const traceContext = validateTraceContextCarrier(tracing.inject({}))

  return {
    ...job,
    ...(traceContext ? { traceContext } : {}),
  }
}
