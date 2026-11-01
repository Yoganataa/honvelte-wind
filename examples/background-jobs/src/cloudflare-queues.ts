import type { IdempotencyStore } from './idempotency-store'
import type { JobHandler } from './processor'
import { processJob } from './processor'
import { calculateRetryDelaySeconds, type RetryPolicy } from './retry'
import { JobEnvelopeSchema, type JobEnvelope } from './types'

export type CloudflareQueueMessage = {
  id: string
  body: unknown
  /** Number of delivery attempts, starting at 1. */
  attempts: number
  ack(): void
  retry(options?: { delaySeconds?: number }): void
}

export type CloudflareQueueBatch = {
  messages: readonly CloudflareQueueMessage[]
}

export type CloudflareQueueConsumerOptions = {
  store: IdempotencyStore
  handlers: ReadonlyMap<string, JobHandler>
  leaseMs: number
  retryPolicy?: RetryPolicy
  busyDelaySeconds?: number
  /** Maximum concurrently processed messages from one delivered batch. */
  concurrency?: number
  now?: () => number
  onFailure?: (failure: {
    messageId: string
    attempts: number
    jobId?: string
    jobType?: string
    error: unknown
  }) => void
}

export class UnknownJobTypeError extends Error {
  constructor(type: string) {
    super('No handler is registered for job type: ' + type)
    this.name = 'UnknownJobTypeError'
  }
}

/** Create a consumer that acknowledges completed jobs and retries failures individually. */
export function createCloudflareQueueHandler(
  options: CloudflareQueueConsumerOptions,
): (batch: CloudflareQueueBatch) => Promise<void> {
  if (!Number.isSafeInteger(options.leaseMs) || options.leaseMs < 1_000) {
    throw new RangeError('leaseMs must be a safe integer of at least 1000ms.')
  }

  const concurrency = options.concurrency ?? 5
  if (!Number.isSafeInteger(concurrency) || concurrency < 1 || concurrency > 100) {
    throw new RangeError('concurrency must be between 1 and 100.')
  }

  const busyDelaySeconds = options.busyDelaySeconds ?? 2
  if (!Number.isSafeInteger(busyDelaySeconds) || busyDelaySeconds < 1 || busyDelaySeconds > 86_400) {
    throw new RangeError('busyDelaySeconds must be between 1 and 86400.')
  }

  const processMessage = async (message: CloudflareQueueMessage): Promise<void> => {
    let job: JobEnvelope | undefined

    try {
      job = JobEnvelopeSchema.parse(message.body)
      const handler = options.handlers.get(job.type)
      if (!handler) throw new UnknownJobTypeError(job.type)

      const result = await processJob(job, handler, {
        store: options.store,
        leaseMs: options.leaseMs,
        ...(options.now ? { now: options.now } : {}),
      })

      if (result === 'busy') {
        message.retry({ delaySeconds: busyDelaySeconds })
        return
      }

      message.ack()
    } catch (error) {
      message.retry({
        delaySeconds: calculateRetryDelaySeconds(
          Number.isSafeInteger(message.attempts) && message.attempts > 0
            ? message.attempts
            : 1,
          options.retryPolicy,
        ),
      })

      try {
        options.onFailure?.({
          messageId: message.id,
          attempts: message.attempts,
          ...(job ? { jobId: job.id, jobType: job.type } : {}),
          error,
        })
      } catch {
        // Telemetry failures must not alter the message acknowledgement.
      }
    }
  }

  return async (batch) => {
    let nextMessageIndex = 0
    const workerCount = Math.min(concurrency, batch.messages.length)

    await Promise.all(
      Array.from({ length: workerCount }, async () => {
        while (true) {
          const message = batch.messages[nextMessageIndex]
          nextMessageIndex += 1
          if (!message) return
          await processMessage(message)
        }
      }),
    )
  }
}
