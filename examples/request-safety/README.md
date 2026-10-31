# Optional API request safety example

This module adds route-scoped request limits and deadlines without adding a rate-limit service, Redis client, or new package to the default workspace.

## Included

- Fixed-window rate limiting with a pluggable asynchronous `RateLimitStore`.
- Bounded in-memory store for a single Bun process.
- Explicit 429 responses with `Retry-After` and the `RateLimit-Policy` / `RateLimit` fields from [draft-ietf-httpapi-ratelimit-headers-11](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/11/), a work-in-progress Internet-Draft (not a final RFC).
- Fail-closed 503 response when the in-memory store reaches its configured key capacity.
- Per-route request deadline that returns 504 and exposes an `AbortSignal` to downstream handlers.
- Deterministic tests for window resets, quota exhaustion, capacity handling, cancellation, and timer cleanup.

## Run the tests

From the repository root:

    bun run test:request-safety

The command type-checks the example using the Hono types already installed by the API workspace, then runs its Bun tests.

## Configure rate limits per route

Rate limits must be applied to the resource and principal that consume the capacity. The key selector is required so the application makes an explicit trust decision:

    import { createRateLimit, InMemoryFixedWindowStore } from './examples/request-safety/src'

    const reportReadLimits = new InMemoryFixedWindowStore(50_000)

    app.get(
      '/api/reports',
      authenticate,
      createRateLimit({
        scope: 'reports:read',
        limit: 60,
        windowMs: 60_000,
        store: reportReadLimits,
        key: (context) => context.get('authSession').userId,
      }),
      listReports,
    )

The example key uses the authenticated internal user ID. Apply authentication before the limiter when using this identity. Configure stricter policies for login, signup, password recovery, OTP validation, expensive queries, or other high-cost operations.

For anonymous traffic, use a trusted source identity. On Bun, Hono's `getConnInfo` helper is provided by the separate `@hono/bun` adapter package. Alternatively, enforce per-IP limits at the trusted reverse proxy or edge gateway. Do not read `X-Forwarded-For` directly from an arbitrary client: a trusted ingress must strip client-supplied values and set the canonical header. If the app cannot establish a reliable key, it should not silently fall back to a spoofable header.

## Store deployment model

`InMemoryFixedWindowStore` is intentionally limited:

- Counters are local to one process and disappear on restart.
- Separate Bun workers or replicas do not share counters.
- The store has a configurable key cap (50,000 by default); once full it prunes expired keys at most once per second, then returns 503 instead of allowing requests through.
- Fixed windows can permit a short burst across a window boundary. Choose a sliding-window or token-bucket algorithm when that behavior is unsuitable.

For multiple processes or replicas, implement the same `RateLimitStore` contract with a shared service. A Redis/Valkey implementation should use one atomic operation or Lua script to increment the scoped key, set the expiry only on first increment, and return the count and reset time. Do not implement this with separate non-atomic GET/INCR/EXPIRE calls. The shared store's key namespace should include the application, route scope, and principal.

## Configure request deadlines

Apply a deadline only to bounded HTTP operations:

    import { createRequestDeadline } from './examples/request-safety/src'

    app.use('/api/reports/*', createRequestDeadline(5_000))

    app.get('/api/reports/:id', async (context) => {
      const signal = context.get('requestSignal')
      const response = await fetch(reportServiceUrl, { signal })

      if (!response.ok) {
        return context.json({ error: 'Report service failed.' }, 502)
      }

      return context.json(await response.json())
    })

The middleware also exposes `requestDeadlineAt` for telemetry and downstream budget calculation. The `AbortSignal` is cancelled when the deadline expires or the client disconnects. Pass it to `fetch`, and use the database/driver's cancellation facility where available.

Important: JavaScript cannot forcibly stop arbitrary work. If a handler ignores the signal, that work may continue after the middleware has returned 504. Do not launch unbounded background work from a request handler. Hand off durable background jobs to a queue with explicit concurrency and retry limits.

Do not use this middleware for SSE, WebSockets, downloads, or other long-lived streaming responses. Use protocol-aware stream cancellation and lifecycle limits instead. Hono's own timeout middleware documents the same streaming restriction.

## Operational guidance

- Keep the reverse proxy's connection, header, body, and upstream timeouts consistent with the app's route deadlines.
- Apply the body-size limit before parsing or buffering payloads; the base API already caps JSON bodies.
- Bound pagination, batch sizes, file sizes, and expensive operation counts in addition to request frequency.
- Use shorter windows/quotas for sensitive or expensive actions and monitor 429/503 rates.
- Keep the default workspace free of Redis, Valkey, and other service dependencies.
- Treat in-memory rate limiting as a development/single-process baseline, not as a distributed abuse-prevention control.
