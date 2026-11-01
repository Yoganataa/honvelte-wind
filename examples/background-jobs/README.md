# Optional background jobs

This example adds a provider-independent job contract and runner, plus optional Cloudflare Queues and D1 adapters. It does not add a queue service, database, SDK, or runtime dependency to the default workspace.

## Included

- Validated job envelopes with stable IDs and per-handler Zod payload validation.
- A provider-independent `IdempotencyStore` contract with atomic claim, token-fenced completion, and release.
- Durable Cloudflare D1 idempotency storage with an SQL migration.
- A Cloudflare Queues consumer that acknowledges only completed/duplicate jobs and retries busy or failed messages individually.
- Capped full-jitter exponential retry delays; the queue provider owns the retry count and dead-letter routing.
- Deterministic scheduled-job IDs derived from the scheduler's occurrence timestamp.
- Tests against SQLite for the D1 SQL behavior and deterministic queue-message stubs.

## Run the tests

From the repository root:

    bun run test:background-jobs

This command type-checks the example and runs Bun tests. No Cloudflare account or live queue is required.

## Define and publish a job

A job ID identifies one unit of business work. Use a new ID for genuinely new work, and keep the same ID when the same work may be delivered again.

    import { createJob } from './examples/background-jobs/src'

    const job = createJob({
      id: 'invoice:inv_123:send-receipt',
      type: 'invoice.send-receipt',
      payload: { invoiceId: 'inv_123' },
    })

    await env.JOBS.send(job)

Keep payloads small and non-sensitive. Prefer opaque record IDs over personal data, access tokens, payment details, or entire database records. Cloudflare Queues currently limits message bodies to 128 KB; applications should use a much smaller operational limit.

## Register a typed handler

The handler schema validates the queue payload at runtime. Do not trust the TypeScript type alone.

    import { z } from 'zod'
    import { defineJobHandler } from './examples/background-jobs/src'

    const sendReceipt = defineJobHandler(
      z.object({ invoiceId: z.string().min(1) }),
      async ({ invoiceId }, context) => {
        await emailProvider.sendReceipt({
          invoiceId,
          idempotencyKey: context.idempotencyKey,
        })
      },
    )

Pass the job idempotency key to downstream APIs that support idempotency. For database side effects, enforce the same key with a unique constraint in the transaction that performs the mutation. A crash after an external side effect but before recording completion can cause redelivery; a queue and local idempotency record alone cannot guarantee exactly-once effects across independent systems.

## Cloudflare Queues consumer

Create a Cloudflare Queues producer and consumer binding, configure a dead-letter queue, and wire the D1 store:

    import { z } from 'zod'
    import {
      createCloudflareQueueHandler,
      defineJobHandler,
      D1IdempotencyStore,
    } from './examples/background-jobs/src'

    const handlers = new Map([
      [
        'invoice.send-receipt',
        defineJobHandler(
          z.object({ invoiceId: z.string().min(1) }),
          async ({ invoiceId }, context) => {
            await emailProvider.sendReceipt({
              invoiceId,
              idempotencyKey: context.idempotencyKey,
            })
          },
        ),
      ],
    ])

    export default {
      async queue(batch, env) {
        const consume = createCloudflareQueueHandler({
          store: new D1IdempotencyStore(env.IDEMPOTENCY_DB, {
            // Must exceed queue retention and any planned DLQ replay window.
            completedRetentionMs: 30 * 24 * 60 * 60 * 1000,
          }),
          handlers,
          // Set this above the bounded execution time of the slowest handler.
          leaseMs: 2 * 60 * 1000,
          onFailure: ({ messageId, attempts, jobType, error }) => {
            // Forward only redacted metadata to your logger/telemetry adapter.
            logger.error('Background job delivery failed', {
              messageId,
              attempts,
              jobType,
              errorName: error instanceof Error ? error.name : 'UnknownError',
            })
          },
        })

        await consume(batch)
      },
    }

The adapter is structural and does not import Cloudflare runtime types. Use a dedicated Worker entry point or extend an existing Worker deliberately; the root `wrangler.jsonc` does not create or bind queues or D1 databases.

Example Wrangler configuration for that dedicated consumer:

    {
      "d1_databases": [
        {
          "binding": "IDEMPOTENCY_DB",
          "database_name": "honvelte-wind-idempotency",
          "database_id": "<D1_DATABASE_ID>"
        }
      ],
      "queues": {
        "producers": [
          {
            "binding": "JOBS",
            "queue": "honvelte-wind-jobs"
          }
        ],
        "consumers": [
          {
            "queue": "honvelte-wind-jobs",
            "max_batch_size": 10,
            "max_batch_timeout": 5,
            "max_retries": 5,
            "dead_letter_queue": "honvelte-wind-jobs-dlq"
          }
        ]
      }
    }

Create the queues and D1 database explicitly, then apply the migration:

    npx wrangler queues create honvelte-wind-jobs
    npx wrangler queues create honvelte-wind-jobs-dlq
    npx wrangler d1 create honvelte-wind-idempotency
    npx wrangler d1 execute honvelte-wind-idempotency --local --file=examples/background-jobs/migrations/0001_idempotency.sql
    npx wrangler d1 execute honvelte-wind-idempotency --remote --file=examples/background-jobs/migrations/0001_idempotency.sql

Replace the D1 ID in the dedicated Worker configuration and use separate local/remote databases. These examples do not provision resources or credentials.

### Retry and dead-letter behavior

Cloudflare Queues delivers messages at least once. Its `attempts` field starts at 1. The adapter computes a full-jitter exponential delay bounded by `maxDelaySeconds` (300 seconds by default); `max_retries` in the consumer configuration sets the retry count after the initial delivery. The example sets five retries, so a poison or persistently failing message is eventually routed to the configured DLQ. Without a DLQ, exhausted messages are deleted by the provider.

Malformed envelopes and unknown job types are retried too, so they reach the DLQ for inspection instead of being silently acknowledged. Keep `onFailure` non-throwing and redact error metadata before logging. A message with an active idempotency lease is retried after a short delay; it must not be acknowledged while another delivery owns the lease.

### Durable idempotency and lease operations

The D1 claim is a single conditional UPSERT. Concurrent deliveries for one key cannot both acquire the same unexpired lease. Each acquired lease gets a unique token; completion and release must match that token, preventing an expired worker from completing or clearing a newer worker's lease.

Set `leaseMs` above the bounded execution time of the handler. This example does not implement lease heartbeats. Long-running work should be split into smaller jobs or extended with a tested lease-renewal protocol. Fencing the store does not undo an external side effect already performed by a stale worker; downstream idempotency remains required.

Completed idempotency keys are retained for a configurable duration. Keep this longer than queue retention and the operational DLQ replay window. `D1IdempotencyStore.purgeExpired({ now, limit })` removes expired completed records and abandoned leases in bounded batches; run it from a scheduled maintenance task and monitor table growth. Do not purge completed keys while a corresponding message may still be replayed.

## Scheduled tasks

Use the scheduler-provided occurrence timestamp to create a deterministic job identity:

    import { createScheduledJob } from './examples/background-jobs/src'

    export default {
      async scheduled(controller, env) {
        await env.JOBS.send(
          createScheduledJob(
            'reports.refresh',
            controller.scheduledTime,
            { scope: 'daily' },
          ),
        )
      },
    }

A repeated delivery of the same scheduled occurrence produces the same job ID. The consumer's durable idempotency store prevents a completed occurrence from running again. This does not make the external side effect exactly-once; apply the same downstream idempotency rule.

## Operational requirements and limitations

- Cloudflare Queues and D1 are optional provider adapters, not base dependencies. The generic runner/store contract can be implemented with PostgreSQL, SQLite, another managed queue, or a platform-native scheduler.
- The D1 adapter requires a durable D1 database and the included migration. It is not a Bun SQLite adapter; no Bun database driver is added to this example.
- `max_retries` and `dead_letter_queue` must be configured on the queue consumer. The generic runner cannot guarantee bounded delivery without a provider enforcing a retry limit.
- Message size, batch size, concurrency, handler duration, D1 limits, retention, and DLQ replay policy must be selected for the actual workload.
- A scheduled trigger should enqueue work quickly; do not run long tasks directly in a request handler or assume a request lifecycle is a durable job runner.
- Review and explicitly redrive DLQ messages. Preserve or intentionally replace their idempotency keys based on whether the original side effect already occurred.
