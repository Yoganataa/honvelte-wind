import { z } from 'zod'
import type { TraceContextCarrier, Tracing } from '@honvelte/contracts'
import type { IdempotencyStore } from './idempotency-store'
import { JobLeaseLostError } from './idempotency-store'
import { JobEnvelopeSchema, type JobEnvelope } from './types'

export type JobHandlerContext = {
  jobId: string
  jobType: string
  idempotencyKey: string
  createdAt: string
}

export type JobHandler = {
  run(payload: unknown, context: JobHandlerContext): Promise<void>
}

/** Validate a queue payload at runtime before application code receives it. */
export function defineJobHandler<TPayload>(
  payloadSchema: z.ZodType<TPayload>,
  run: (payload: TPayload, context: JobHandlerContext) => Promise<void>,
): JobHandler {
  return {
    async run(payload, context) {
      await run(payloadSchema.parse(payload), context)
    },
  }
}

export type ProcessJobResult = 'completed' | 'duplicate' | 'busy'

export type ProcessJobOptions = {
  store: IdempotencyStore
  leaseMs: number
  now?: () => number
  tracing?: Tracing
  parent?: TraceContextCarrier
}

/** Execute one job using an atomic, lease-based idempotency store. */
export async function processJob(
  job: JobEnvelope,
  handler: JobHandler,
  options: ProcessJobOptions,
): Promise<ProcessJobResult> {
  const validatedJob = JobEnvelopeSchema.parse(job)

  if (!Number.isSafeInteger(options.leaseMs) || options.leaseMs < 1_000) {
    throw new RangeError('leaseMs must be a safe integer of at least 1000ms.')
  }

  const execute = async (span?: import('@honvelte/contracts').TraceSpan): Promise<ProcessJobResult> => {
  const now = options.now ?? Date.now
  const claimedAt = now()
  const leaseExpiresAt = claimedAt + options.leaseMs

  if (!Number.isSafeInteger(leaseExpiresAt)) {
    throw new RangeError('The calculated job lease expiry is invalid.')
  }

  const claim = await options.store.claim({
    key: validatedJob.id,
    now: claimedAt,
    leaseExpiresAt,
  })

  if (claim.status === 'completed') return 'duplicate'
  if (claim.status === 'busy') return 'busy'
  span?.setAttribute('app.job.type', validatedJob.type)

  try {
    await handler.run(validatedJob.payload, {
      jobId: validatedJob.id,
      jobType: validatedJob.type,
      idempotencyKey: validatedJob.id,
      createdAt: validatedJob.createdAt,
    })
  } catch (error) {
    try {
      await options.store.release({
        key: validatedJob.id,
        token: claim.token,
      })
    } catch (releaseError) {
      throw new AggregateError(
        [error, releaseError],
        'Job execution failed and its idempotency lease could not be released.',
        { cause: releaseError },
      )
    }

    throw error
  }

  const completed = await options.store.complete({
    key: validatedJob.id,
    token: claim.token,
    completedAt: now(),
  })

  if (!completed) throw new JobLeaseLostError()
  return 'completed'
  }

  if (!options.tracing) return execute()

  return options.tracing.withSpan(
    'background.job.execute',
    {
      kind: 'consumer',
      attributes: { 'app.job.type': validatedJob.type },
      ...(options.parent ? { parent: options.parent } : {}),
    },
    (span) => execute(span),
  )
}
