import { createApp } from './app'
import { createLogger } from './observability/logger'
import {
  createCloudflareTracing,
  type CloudflareNativeTracing,
} from './observability/cloudflare-tracing'

// Cloudflare Workers invokes this standard Fetch handler for /api/* requests.
// Static SPA assets are served directly by the Workers Static Assets binding.
const logger = createLogger({ level: 'info' })
const app = createApp({ logger })

type WorkerExecutionContext = {
  tracing?: CloudflareNativeTracing
}

export default {
  async fetch(
    request: Request,
    _environment?: unknown,
    executionContext?: WorkerExecutionContext,
  ): Promise<Response> {
    const tracing = executionContext?.tracing
      ? createCloudflareTracing(executionContext.tracing)
      : undefined
    const requestApp = tracing ? createApp({ logger, tracing }) : app
    return await requestApp.fetch(request)
  },
}
