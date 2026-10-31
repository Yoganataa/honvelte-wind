# Optional sessions, OIDC, and RBAC example

This example adds an opt-in authentication boundary without adding an auth provider, session package, ORM, or database dependency to the default workspace.

It uses Hono's cookie helper and Bun's built-in `bun:sqlite` driver. The SQLite store is a small durable adapter for a single-node deployment. Implement the same `SessionStore` and `AuthorizationStore` contracts with PostgreSQL or another shared database before running multiple API instances.

## Included

- Opaque session cookie containing a public lookup ID and a random verifier.
- SHA-256 verifier hash stored server-side; the raw verifier is never persisted.
- 12-hour server-side expiry, expired-session cleanup, and explicit revocation.
- Production `__Host-` cookie with `Secure`, `HttpOnly`, `Path=/`, and `SameSite=Lax`.
- Synchronizer CSRF token returned by an authenticated endpoint and checked on state-changing requests.
- Exact `Origin` validation for protected mutations.
- Permission middleware that reads the current permissions from an authorization store on every request.
- An OIDC identity boundary keyed by the verified `(issuer, subject)` pair, never by email address.

## Run the tests

From the repository root:

    bun test examples/auth

No additional install is required. The tests use in-memory SQLite databases.

## Integrate the session middleware

Create the durable store at application startup and inject it into the session service:

    import { Database } from 'bun:sqlite'
    import { createSessionAuth } from './examples/auth/src/http'
    import { SqliteSessionStore } from './examples/auth/src/sqlite-session-store'
    import { SessionService } from './examples/auth/src/session'

    const database = new Database('./data/app.sqlite', { create: true })
    const sessions = new SessionService(new SqliteSessionStore(database))
    const cookiePolicy = { secure: process.env.NODE_ENV === 'production' }

Mount the auth routes after configuring the expected public origin:

    import { createAuthRoutes } from './examples/auth/src/routes'

    app.route('/api/auth', createAuthRoutes(sessions, {
      cookie: cookiePolicy,
      appOrigin: process.env.APP_ORIGIN!,
    }))

Protected routes must compose authentication before authorization:

    import { requirePermission } from './examples/auth/src/authorization'

    app.get(
      '/api/reports',
      createSessionAuth(sessions, cookiePolicy),
      requirePermission('reports:read', authorizationStore),
      (context) => context.json({ reports: [] }),
    )

The `AuthorizationStore` must load permissions from the server-side user/role tables. Do not put roles, permissions, or trusted user attributes in the cookie. The middleware deliberately fetches current permissions for each request so role revocation takes effect without waiting for a session refresh.

When a verified identity provider callback succeeds, issue a new application session and set the cookie:

    const issued = await issueSessionForOidcIdentity(
      verifiedIdentity,
      oidcIdentityStore,
      sessions,
    )
    setSessionCookie(context, issued.cookieValue, cookiePolicy)

`verifiedIdentity` must come from a successful OIDC library callback, not from request JSON or an unverified JWT decode. Revoke any pre-authentication session before replacing it with the authenticated session.

## OIDC integration

The core example does not ship an OIDC client. When an application chooses OIDC, use a maintained protocol implementation rather than writing discovery, token exchange, JWT validation, or JWKS handling yourself.

For Bun, `openid-client` v6 is a suitable optional integration: v6 was rewritten for Web API-compatible runtimes including Bun, and the current documented API provides discovery, Authorization Code Grant, PKCE, state, and nonce helpers. Install the pinned version only in the application that opts in:

    bun add --cwd apps/api openid-client@6.8.8

A minimal server-side setup uses issuer discovery:

    import * as oidc from 'openid-client'

    const oidcConfig = await oidc.discovery(
      new URL(process.env.OIDC_ISSUER!),
      process.env.OIDC_CLIENT_ID!,
      process.env.OIDC_CLIENT_SECRET!,
    )

Generate fresh PKCE, state, and nonce values for every authorization attempt:

    const codeVerifier = oidc.randomPKCECodeVerifier()
    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier)
    const state = oidc.randomState()
    const nonce = oidc.randomNonce()

    const authorizationUrl = oidc.buildAuthorizationUrl(oidcConfig, {
      redirect_uri: process.env.OIDC_REDIRECT_URI!,
      scope: 'openid profile email',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      nonce,
    })

Before redirecting, persist `{ state, nonce, codeVerifier }` in a short-lived, one-time server-side authorization transaction and bind that transaction to the initiating browser with a Secure, HttpOnly, SameSite=Lax cookie. Do not put the verifier or tokens in localStorage, a browser-readable cookie, or a URL.

At the callback, recover and consume that transaction exactly once, then let `openid-client` validate the authorization response and exchange the code:

    const tokens = await oidc.authorizationCodeGrant(
      oidcConfig,
      new URL(context.req.url),
      {
        pkceCodeVerifier: transaction.codeVerifier,
        expectedState: transaction.state,
        expectedNonce: transaction.nonce,
      },
    )

    const claims = tokens.claims()
    if (!claims || typeof claims.sub !== 'string') {
      throw new Error('OIDC response did not contain a valid subject.')
    }

    const verifiedIdentity = {
      issuer: oidcConfig.serverMetadata().issuer,
      subject: claims.sub,
      ...(typeof claims.email === 'string' ? { email: claims.email } : {}),
      ...(typeof claims.email_verified === 'boolean'
        ? { emailVerified: claims.email_verified }
        : {}),
    }

    // Pass this verified identity into issueSessionForOidcIdentity().

This is the protocol integration boundary, not a complete provider registration or callback route. Configure an exact redirect URI with the provider, keep client credentials server-side, require HTTPS in production, and test the chosen provider's logout and account-linking semantics before enabling it.

Account mapping must use the exact issuer identifier and subject pair, including its full path and trailing-slash form. Never automatically link a new identity to an existing account based only on a matching email address; email can change and provider verification semantics differ. Treat provider-specific account linking as a separate, authenticated workflow.

## CSRF and browser behavior

For an authenticated browser session:

1. Call `GET /api/auth/csrf` and retain the returned token in application memory.
2. Send it in `X-CSRF-Token` on every state-changing request.
3. Send the browser's `Origin` header; the server compares it with the configured exact `APP_ORIGIN`.
4. Use `POST`, `PUT`, `PATCH`, or `DELETE` for mutations. Safe methods must never change server state.

`SameSite=Lax` is defense in depth, not a replacement for the synchronizer token and origin check. The cookie is HttpOnly; JavaScript must never read the session identifier.

## Operational requirements

- Use a durable shared store in production. The bundled SQLite adapter is intended for a single-node deployment; do not replace it with a process-local Map in production.
- Restrict database access and protect backups. Session rows contain a CSRF token and a one-way hash of the session verifier.
- Use HTTPS end-to-end. The production `__Host-` cookie is intentionally not set as a non-Secure cookie.
- Keep the session TTL bounded. Revoke the old session and issue a new one after login, account recovery, password changes, and privilege changes.
- Rate-limit login initiation, callback, logout, and account recovery endpoints at the application ingress.
- Audit authorization at the resource/action boundary; authentication alone is not authorization.
- Do not trust role or permission claims from an unvalidated client payload or a stale session cookie.
- Keep OIDC access/refresh tokens server-side. Do not forward an OIDC access token as the application's session cookie.

This example intentionally does not add local-password login, password-reset, MFA, account recovery, refresh-token persistence, or a provider-specific logout implementation. These are separate features with their own threat models.
