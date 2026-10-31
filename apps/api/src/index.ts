import { serveStatic } from 'hono/bun'
import { resolve } from 'node:path'
import { createApp } from './app'
import { env } from './env'
import { createRuntimeLifecycle } from './runtime/lifecycle'
import { stopServerGracefully } from './runtime/shutdown'

const lifecycle = createRuntimeLifecycle()
const app = createApp(lifecycle)
const webDist = resolve(import.meta.dir, '../../web/dist')

if (env.NODE_ENV === 'production') {
  app.use(
    '*',
    serveStatic({
      root: webDist,
      rewriteRequestPath: (path) => path,
    }),
  )
  app.get('*', async (c, next) => {
    if (c.req.path.startsWith('/api/')) return next()
    return c.html(await Bun.file(resolve(webDist, 'index.html')).text())
  })
}

const server = Bun.serve({
  hostname: env.HOST,
  port: env.PORT,
  idleTimeout: env.SERVER_IDLE_TIMEOUT_SECONDS,
  maxRequestBodySize: env.SERVER_MAX_REQUEST_BODY_BYTES,
  fetch: app.fetch,
})

console.info(
  `Honvelte Wind listening on http://${server.hostname}:${server.port}`,
)

let shutdownPromise: Promise<void> | undefined

function shutdown(signal: 'SIGINT' | 'SIGTERM'): Promise<void> {
  if (shutdownPromise) return shutdownPromise

  lifecycle.beginShutdown()
  console.info({
    event: 'server.shutdown.started',
    signal,
    gracePeriodMs: env.SHUTDOWN_TIMEOUT_MS,
  })

  shutdownPromise = (async () => {
    if (env.SHUTDOWN_READINESS_DELAY_MS > 0) {
      await Bun.sleep(env.SHUTDOWN_READINESS_DELAY_MS)
    }

    return stopServerGracefully(
      server,
      env.SHUTDOWN_TIMEOUT_MS,
    )
  })()
    .then((outcome) => {
      if (outcome === 'forced') {
        console.warn({
          event: 'server.shutdown.forced',
          signal,
          gracePeriodMs: env.SHUTDOWN_TIMEOUT_MS,
        })
      }

      console.info({
        event: 'server.shutdown.completed',
        signal,
        outcome,
      })
    })
    .catch((error: unknown) => {
      console.error({
        event: 'server.shutdown.failed',
        signal,
        error,
      })
      process.exitCode = 1
    })

  return shutdownPromise
}

process.once('SIGINT', () => {
  void shutdown('SIGINT')
})

process.once('SIGTERM', () => {
  void shutdown('SIGTERM')
})
