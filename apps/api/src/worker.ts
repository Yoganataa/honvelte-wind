import { createApp } from './app'
import { createLogger } from './observability/logger'

// Cloudflare Workers invokes this standard Fetch handler for /api/* requests.
// Static SPA assets are served directly by the Workers Static Assets binding.
const app = createApp({
  logger: createLogger({ level: 'info' }),
})

export default {
  fetch(request: Request): Promise<Response> {
    return app.fetch(request)
  },
}
