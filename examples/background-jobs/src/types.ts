import { z } from 'zod'

export const JobEnvelopeSchema = z
  .object({
    id: z.string().min(1).max(128).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/),
    type: z.string().min(1).max(64).regex(/^[a-z][a-z0-9.-]{0,63}$/),
    payload: z.unknown(),
    createdAt: z.string().datetime(),
  })
  .strict()
  .superRefine((job, context) => {
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
}

export type NewJob<TPayload> = {
  id: string
  type: string
  payload: TPayload
  createdAt?: string
}

/** Create a validated envelope with a stable ID for one unit of business work. */
export function createJob<TPayload>(input: NewJob<TPayload>): JobEnvelope<TPayload> {
  const envelope = {
    id: input.id,
    type: input.type,
    payload: input.payload,
    createdAt: input.createdAt ?? new Date().toISOString(),
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
