# Deployment profiles

Honvelte Wind currently has two CI-validated deployment profiles. CI validates builds and local runtime behavior; it does not deploy to a live account or prove a production rollout.

## 1. Bun server: API and SPA in one process

This is the default deployment profile and the one used by the production delivery artifact.

Requirements:

- The Bun version pinned in `.bun-version`.
- A host or process manager that can run a long-lived Bun process.
- A reverse proxy or platform ingress for public TLS termination.

Build and start:

```bash
bun install --frozen-lockfile
bun run build
NODE_ENV=production HOST=0.0.0.0 PORT=3000 bun run start
```

The Bun entry point uses `Bun.serve`, serves the generated SPA from `apps/web/dist`, and mounts the API below `/api/*`. The `.env.example` file documents the supported environment variables. Set secrets in the process environment or the deployment platform's secret manager, not in the image or source repository.

Use `GET /api/health` as the process liveness probe and `GET /api/ready` as the traffic readiness probe. On `SIGINT` or `SIGTERM`, the process marks readiness false, rejects new application traffic, drains active requests, and force-closes remaining connections after the configured grace period. Set the platform termination grace period longer than `SHUTDOWN_READINESS_DELAY_MS + SHUTDOWN_TIMEOUT_MS` plus process-exit margin.

The existing CI delivery job creates and smoke-tests a production tarball. Download the `honvelte-wind-production-<commit>` artifact from the successful workflow run; it is a deployable bundle, not an automated hosting deployment.

## 2. Cloudflare Workers: edge API and static SPA assets

The optional Cloudflare profile is configured in the root `wrangler.jsonc`:

- `apps/api/src/worker.ts` exposes the Hono application through the standard Fetch API.
- `apps/web/dist` is uploaded as Workers Static Assets.
- `/api/*` is routed to the Worker first.
- Other paths are served as static assets, with SPA navigation fallback to `index.html`.

The browser keeps using same-origin `/api` requests; no CORS policy or separate API origin is needed.

Build and run locally:

```bash
bun install --frozen-lockfile
bun run build
npx --yes wrangler@4.156.0 dev --local
```

After authenticating with Wrangler and selecting the intended Cloudflare account, deploy with:

```bash
npx --yes wrangler@4.156.0 deploy
```

The Wrangler version is pinned in CI so configuration and bundling checks are reproducible. The profile uses a compatibility date of `2026-10-30`, the newest date supported by the `workerd` binary bundled with the pinned Wrangler `4.156.0` in CI. Workers automatically provide the supported Node.js built-ins for compatibility dates on or after `2026-08-04`; this covers the shared API module graph's `node:crypto` use for the optional metrics route. Refresh the compatibility date only after the selected Wrangler/runtime toolchain supports the newer date in local and CI validation. No explicit compatibility flag is required. The metrics route remains disabled by default. Do not enable process-local Prometheus metrics in a multi-isolate Worker deployment and assume they represent global traffic.

### Worker runtime boundaries

The Worker profile runs the stateless core API and static SPA. It is not a drop-in runtime for every optional example:

- The Bun server's signal handling, idle timeout, and graceful connection draining belong to the long-lived Bun process and are not used by Workers. Cloudflare controls isolate lifecycle.
- The Worker readiness endpoint reports only the app lifecycle state. Add explicit checks for any external dependency that becomes mandatory.
- The SQLite and PostgreSQL examples use `bun:sqlite` and `Bun.SQL`; they are not Worker database adapters. Add a platform-compatible adapter and integration tests before using a database from this profile.
- The auth example's bundled SQLite session store is single-node and Bun-specific. Use a durable shared session/authorization store and validate the chosen identity-provider flow before enabling authentication on Workers.
- The request-safety example's in-memory store is process-local. It is not a global rate limiter across Worker isolates or regions; inject a shared, platform-appropriate store before relying on distributed quotas.
- Prometheus metrics in the Bun profile are held in process memory. Use platform-native Workers telemetry or a deliberately designed external metrics adapter for edge deployments.

If a Worker feature needs environment variables or secrets, declare a typed Worker binding and read it from the `env` argument. Do not import the Bun entry point or assume `process.env` exists in the Worker runtime. Keep secrets in Wrangler secrets or the platform secret manager, not in checked-in `vars`.

### CI validation

The `Cloudflare Workers profile` CI job:

1. Runs the Worker adapter tests against standard Fetch `Request` and `Response` objects.
2. Starts the local `workerd` runtime through the pinned Wrangler CLI.
3. Smoke-tests the API health route, greeting route, and SPA asset fallback.

This verifies the local Worker bundle and routing configuration. It does not deploy a Worker, configure a custom domain, create production secrets, or validate a live account's limits and billing.

## 3. Controlled Cloudflare delivery

Two manual GitHub Actions workflows are provided:

- **Deploy Cloudflare Worker** builds and verifies the repository, validates the selected local Worker environment, deploys it, and smoke-tests the live API and SPA.
- **Rollback Cloudflare Worker** restores an explicitly selected prior Worker version and verifies the restored health route and SPA.

Both workflows can run only from `main`. Select exactly one target, `staging` or `production`. They are not triggered by pull requests or ordinary pushes. The deploy workflow uses a concurrency group per environment so two deploy/rollback operations cannot intentionally run in parallel for the same target.

### One-time setup

1. Create the GitHub Environments named `staging` and `production` before the first deployment. GitHub can auto-create an environment when a workflow references a missing name, but that environment has no secrets or protection rules; configuring it first avoids an unprotected deployment attempt.
2. For each GitHub Environment, add the **environment secret** `CLOUDFLARE_API_TOKEN`, using a separate token scoped to that environment's existing Worker.
3. For each GitHub Environment, add these **environment variables**:
   - `CLOUDFLARE_ACCOUNT_ID`: the Cloudflare account ID containing that Worker. This is an identifier, not an authentication secret.
   - `WORKER_BASE_URL`: that Worker's public HTTPS origin, without a trailing path. For example: `https://honvelte-wind-staging.<your-workers-dev-subdomain>.workers.dev`.
4. Restrict deployment branches to `main` in both environments. For `production`, configure Required reviewers and enable Prevent self-review. These protections are configured in GitHub repository settings, not in workflow YAML.
5. Create the two Workers once in Cloudflare (or use a temporary setup token with Workers product-level Admin permission), then remove/revoke that elevated token and scope the routine CI tokens to the corresponding existing Worker. Prefer separate tokens for staging and production.

The recommended Cloudflare permission is **Workers Editor** scoped to the individual existing Worker. A deployment that creates a new Worker requires broader Workers product-level Admin permission; do not keep that broader permission on a routine deployment token. No DNS route or custom domain is configured by this starter: the example profile uses each environment’s `workers.dev` URL.

### Deploy

From the `main` branch, open **Actions → Deploy Cloudflare Worker → Run workflow**, choose `staging` first, then `production` after the staging deployment has been reviewed.

The workflow runs `bun run verify:all`, the Fetch adapter tests, and a local `workerd` smoke test using the selected Wrangler environment. It then deploys with the pinned Wrangler CLI and verifies:

- `GET /api/health` returns `200` with `status: "ok"`.
- `POST /api/greet` returns the expected JSON contract.
- `/` serves the Svelte SPA.

When a post-deploy smoke test fails, the workflow attempts to deploy the previously active Worker version again and still marks the workflow as failed so the release requires investigation. Automatic rollback requires an earlier successful deployment; the first deployment has no previous version to restore.

### Manual rollback

Use **Actions → Rollback Cloudflare Worker** from `main`, choose the target environment, and supply the exact version UUID to restore.

List recent versions for the selected Worker:

```bash
npx --yes wrangler@4.156.0 versions list --name honvelte-wind-staging
npx --yes wrangler@4.156.0 versions list --name honvelte-wind-production
```

The workflow runs `wrangler rollback <VERSION_ID>` against the selected Worker and checks the public health route and SPA after rollback. A rollback is a new deployment of the selected old Worker version; it does not reverse changes to external state such as database records or object storage. Review and roll back data migrations separately.

### Operational boundaries

The deploy and rollback workflows remain inactive until the GitHub Environments, `CLOUDFLARE_API_TOKEN` secrets, and `CLOUDFLARE_ACCOUNT_ID` / `WORKER_BASE_URL` variables are configured. The selected environment URL is also attached to the GitHub deployment record. No Cloudflare account, domain, token, or production deployment is provisioned by this repository change.

## Choosing a profile

Use the Bun server when the application needs the bundled Bun-specific database/auth examples, process-level lifecycle control, or the current in-process Prometheus registry. Use the Cloudflare profile for the stateless core API and static SPA when edge execution is an explicit deployment requirement. Do not combine the profiles behind the same public route without an intentional routing and session strategy.
