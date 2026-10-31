import { getCookie, setCookie } from 'hono/cookie'
import type { Context, MiddlewareHandler } from 'hono'
import { timingSafeEqual } from 'node:crypto'
import type { AuthSession, SessionService } from './session'

export const SESSION_COOKIE_NAME = 'honvelte_session'

export type AuthEnv = {
  Variables: {
    authSession: AuthSession
  }
}

export type SessionCookieOptions = {
  secure: boolean
  maxAgeSeconds?: number
}

function cookieOptions(options: SessionCookieOptions) {
  return {
    path: '/' as const,
    httpOnly: true,
    secure: options.secure,
    sameSite: 'Lax' as const,
    maxAge: options.maxAgeSeconds ?? 12 * 60 * 60,
    ...(options.secure ? { prefix: 'host' as const } : {}),
  }
}

export function readSessionCookie(
  context: Context,
  options: SessionCookieOptions,
): string | undefined {
  return getCookie(
    context,
    SESSION_COOKIE_NAME,
    options.secure ? 'host' : undefined,
  )
}

export function setSessionCookie(
  context: Context,
  cookieValue: string,
  options: SessionCookieOptions,
): void {
  setCookie(context, SESSION_COOKIE_NAME, cookieValue, cookieOptions(options))
}

export function clearSessionCookie(
  context: Context,
  options: SessionCookieOptions,
): void {
  setCookie(context, SESSION_COOKIE_NAME, '', {
    ...cookieOptions(options),
    maxAge: 0,
    expires: new Date(0),
  })
}

export function createSessionAuth(
  sessions: SessionService,
  cookie: SessionCookieOptions,
): MiddlewareHandler<AuthEnv> {
  return async (context, next) => {
    const cookieValue = readSessionCookie(context, cookie)
    const session = await sessions.resolve(cookieValue)

    if (!session) {
      context.header('Cache-Control', 'no-store')
      return context.json(
        {
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required.',
          },
        },
        401,
      )
    }

    context.set('authSession', session)
    context.header('Cache-Control', 'no-store')
    await next()
  }
}

function safeEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left, 'utf8')
  const rightBytes = Buffer.from(right, 'utf8')

  return (
    leftBytes.length === rightBytes.length &&
    timingSafeEqual(leftBytes, rightBytes)
  )
}

export function requireCsrfProtection(
  expectedOrigin: string,
): MiddlewareHandler<AuthEnv> {
  const configuredOrigin = new URL(expectedOrigin).origin

  if (configuredOrigin !== expectedOrigin) {
    throw new TypeError('Expected application origin must not contain a path.')
  }

  return async (context, next) => {
    const session = context.get('authSession')
    const requestOrigin = context.req.header('origin')
    const csrfToken = context.req.header('x-csrf-token')

    if (
      requestOrigin !== configuredOrigin ||
      !csrfToken ||
      !safeEqual(csrfToken, session.csrfToken)
    ) {
      return context.json(
        {
          error: {
            code: 'CSRF_REJECTED',
            message: 'Request origin or CSRF token was rejected.',
          },
        },
        403,
      )
    }

    await next()
  }
}
