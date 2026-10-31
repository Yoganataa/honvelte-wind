import { serveStatic } from 'hono/bun'
import { resolve } from 'node:path'
import { createApp } from './app'
import { env } from './env'
import {
  createHttpMetrics,
  createNoopHttpMetrics,
} from './observability/http-metrics'
import { createLogger } from './observability/logger'
import { createRuntimeLifecycle } from './runtime/lifecycle'
import { stopServerGracefully } from './runtime/shutdown'

const lifecycle = createRuntimeLifecycle()
const logger = createLogger({ level: env.LOG_LEVEL })
const metrics = env.METRICS_ENABLED
  ? createHttpMetrics()
  : createNoopHttpMetrics()
const app = createApp({
  lifecycle,
  logger,
  metrics,
  metricsEnabled: env.METRICS_ENABLED,
  ...(env.METRICS_TOKEN ? { metricsToken: env.METRICS_TOKEN } : {}),
})
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

logger.info('server.started', {
  host: server.hostname,
  port: server.port,
  metricsEnabled: env.METRICS_ENABLED,
})

let shutdownPromise: Promise<void> | undefined

function shutdown(signal: 'SIGINT' | 'SIGTERM'): Promise<void> {
  if (shutdownPromise) return shutdownPromise

  lifecycle.beginShutdown()
  logger.info('server.shutdown.started', {
    signal,
    readinessDelayMs: env.SHUTDOWN_READINESS_DELAY_MS,
    gracePeriodMs: env.SHUTDOWN_TIMEOUT_MS,
  })

  shutdownPromise = (async () => {
    if (env.SHUTDOWN_READINESS_DELAY_MS > 0) {
      await Bun.sleep(env.SHUTDOWN_READINESS_DELAY_MS)
    }

    return stopServerGracefully(server, env.SHUTDOWN_TIMEOUT_MS)
  })()
    .then((outcome) => {
      if (outcome === 'forced') {
        logger.warn('server.shutdown.forced', {
          signal,
          gracePeriodMs: env.SHUTDOWN_TIMEOUT_MS,
        })
      }

      logger.info('server.shutdown.completed', {
        signal,
        outcome,
      })
    })
    .catch((error: unknown) => {
      logger.error('server.shutdown.failed', {
        signal,
        errorType: error instanceof Error ? error.name : typeof error,
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
