import type { MiddlewareHandler } from 'hono'
import type { AuthEnv } from './http'

export type Permission = string

export interface AuthorizationStore {
  getPermissionsForUser(userId: string): Promise<ReadonlySet<Permission>>
}

export function requirePermission(
  permission: Permission,
  authorization: AuthorizationStore,
): MiddlewareHandler<AuthEnv> {
  if (!permission.trim()) {
    throw new TypeError('Permission must be a non-empty string.')
  }

  return async (context, next) => {
    const session = context.get('authSession')
    const permissions = await authorization.getPermissionsForUser(
      session.userId,
    )

    if (!permissions.has(permission)) {
      return context.json(
        { error: { code: 'FORBIDDEN', message: 'Permission denied.' } },
        403,
      )
    }

    await next()
  }
}
