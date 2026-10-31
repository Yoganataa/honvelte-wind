import { serveStatic } from 'hono/bun'
import { resolve } from 'node:path'
import app from './app'
import { env } from './env'

const webDist = resolve(import.meta.dir, '../../web/dist')

if (env.NODE_ENV === 'production') {
  app.use('/*', serveStatic({ root: webDist, rewriteRequestPath: (path) => path }))
  app.get('*', serveStatic({ path: resolve(webDist, 'index.html') }))
}

const server = Bun.serve({
  hostname: env.HOST,
  port: env.PORT,
  fetch: app.fetch,
})

console.info(`Honvelte Wind listening on http://${server.hostname}:${server.port}`)
