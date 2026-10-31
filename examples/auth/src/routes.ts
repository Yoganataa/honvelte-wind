import { Hono } from 'hono'
import type { AuthEnv, SessionCookieOptions } from './http'
import {
  clearSessionCookie,
  createSessionAuth,
  requireCsrfProtection,
} from './http'
import type { SessionService } from './session'

export type AuthRoutesOptions = {
  cookie: SessionCookieOptions
  appOrigin: string
}

export function createAuthRoutes(
  sessions: SessionService,
  options: AuthRoutesOptions,
) {
  const routes = new Hono<AuthEnv>()

  routes.use('*', createSessionAuth(sessions, options.cookie))

  routes.get('/session', (context) => {
    const session = context.get('authSession')

    return context.json({
      userId: session.userId,
      expiresAt: new Date(session.expiresAt).toISOString(),
    })
  })

  routes.get('/csrf', (context) =>
    context.json({
      csrfToken: context.get('authSession').csrfToken,
    }),
  )

  routes.post(
    '/logout',
    requireCsrfProtection(options.appOrigin),
    async (context) => {
      const session = context.get('authSession')
      await sessions.revoke(session.id)
      clearSessionCookie(context, options.cookie)

      return context.json({ success: true as const })
    },
  )

  return routes
}
