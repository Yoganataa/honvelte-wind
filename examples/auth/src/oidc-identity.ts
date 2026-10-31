import type { IssuedSession, SessionService } from './session'

export type VerifiedOidcIdentity = {
  issuer: string
  subject: string
  email?: string
  emailVerified?: boolean
  displayName?: string
}

export interface OidcIdentityStore {
  findOrCreateUserId(identity: {
    issuer: string
    subject: string
    email?: string
    emailVerified?: boolean
    displayName?: string
  }): Promise<string>
}

/**
 * Call this only with claims returned by a completed, validated OIDC
 * Authorization Code flow. Never pass an unverified token payload here.
 */
export async function issueSessionForOidcIdentity(
  identity: VerifiedOidcIdentity,
  identityStore: OidcIdentityStore,
  sessions: SessionService,
): Promise<IssuedSession> {
  let issuer: URL
  try {
    issuer = new URL(identity.issuer)
  } catch {
    throw new TypeError('OIDC issuer must be an absolute HTTPS URL.')
  }

  if (
    issuer.protocol !== 'https:' ||
    issuer.username.length > 0 ||
    issuer.password.length > 0 ||
    issuer.search.length > 0 ||
    issuer.hash.length > 0 ||
    !identity.subject.trim() ||
    identity.subject.length > 255
  ) {
    throw new TypeError('OIDC issuer and subject are not valid.')
  }

  const userId = await identityStore.findOrCreateUserId({
    issuer: identity.issuer,
    subject: identity.subject,
    ...(identity.email ? { email: identity.email } : {}),
    ...(identity.emailVerified !== undefined
      ? { emailVerified: identity.emailVerified }
      : {}),
    ...(identity.displayName ? { displayName: identity.displayName } : {}),
  })

  return sessions.create(userId)
}
