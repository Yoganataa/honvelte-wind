import { serveStatic } from 'hono/bun'
import { resolve } from 'node:path'
import app from './app'
import { env } from './env'

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
  fetch: app.fetch,
})

console.info(
  `Honvelte Wind listening on http://${server.hostname}:${server.port}`,
)
