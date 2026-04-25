# Auth Lazy Initialization — Decision Record + Production Deploy Guide

> **Status:** Implemented in `fix/auth-lazy-init` branch.
> **Supersedes:** the `fix/build-without-env` placeholder fallback (PR #21).
> **Audience:** Anyone deploying Lumen to production, extending auth, or reviewing the build pipeline.

---

## TL;DR

The Better Auth instance is now constructed **lazily** by a `getAuth()` getter, on first call, instead of being constructed at module-import time. This:

1. Lets `pnpm build` complete with zero environment variables present (the build no longer touches the env).
2. **Removes the placeholder secret entirely** — there is no silent fallback. Production fails fast on the first request if `BETTER_AUTH_SECRET` is missing.
3. Preserves full TypeScript type fidelity across all import sites.

---

## What changed

### Before (the smell)

`src/lib/server/auth.ts` constructed the Better Auth instance at module init:

```ts
// Top-level — runs on every module import, including during build's `analyse` step
const resolvedSecret = (() => {
  const v = env('BETTER_AUTH_SECRET');
  if (v) return v;
  if (isProduction) throw new Error('BETTER_AUTH_SECRET is required in production.');
  console.warn('[auth] BETTER_AUTH_SECRET is not set. Using a placeholder…');
  return 'lumen-dev-placeholder-not-cryptographically-safe-set-BETTER_AUTH_SECRET';
})();

export const auth = betterAuth({
  secret: resolvedSecret,
  // …config…
});
```

Every consumer imported the constructed instance:

```ts
import { auth } from '$lib/server/auth';
const session = await auth.api.getSession({ headers });
```

### After (the rigorous fix)

```ts
// src/lib/server/auth.ts

let _instance: ReturnType<typeof buildAuth> | null = null;

export function getAuth(): ReturnType<typeof buildAuth> {
  if (!_instance) _instance = buildAuth();
  return _instance;
}

function buildAuth() {
  // Env reads + validation happen HERE, only on first call.
  return betterAuth({
    secret: required('BETTER_AUTH_SECRET'),  // hard throw if missing — no placeholder
    // …config…
  });
}

export type Auth = ReturnType<typeof getAuth>;
export type AuthSession = Awaited<ReturnType<Auth['api']['getSession']>>;
```

Every consumer calls `getAuth()` instead of importing a top-level `auth`:

```ts
import { getAuth } from '$lib/server/auth';
const session = await getAuth().api.getSession({ headers });
```

### Files touched (8)

| File | Change |
|---|---|
| `src/lib/server/auth.ts` | Replaced `export const auth = betterAuth({…})` with `export function getAuth()`. Removed placeholder secret. Moved all env reads inside `buildAuth()`. |
| `src/hooks.server.ts` | `auth.api.getSession` → `getAuth().api.getSession` |
| `src/routes/api/auth/[...all]/+server.ts` | `auth.handler` → `getAuth().handler` |
| `src/routes/(auth)/sign-in/+page.server.ts` | `auth.api.signInEmail` → `getAuth().api.signInEmail` |
| `src/routes/(auth)/sign-up/+page.server.ts` | `auth.api.signUpEmail` → `getAuth().api.signUpEmail` |
| `src/routes/(auth)/forgot-password/+page.server.ts` | `auth.api.requestPasswordReset` → `getAuth().api.requestPasswordReset` |
| `src/routes/(auth)/reset-password/+page.server.ts` | `auth.api.resetPassword` → `getAuth().api.resetPassword` |
| `src/routes/account/security/+page.server.ts` | Hoists `const auth = getAuth()` inside `load`, uses `auth.api.listSessions` etc. (avoids re-calling `getAuth()` per chained method) |

`src/app.d.ts` was untouched — it imports `AuthSession` as a type only, which is module-import-safe.

---

## Why the placeholder fallback was wrong

It "worked" in the narrow sense that builds passed. But it violated three rigorous-engineering principles:

### 1. Misconfiguration must not pass silently

The placeholder string was a real, valid secret as far as Better Auth's constructor was concerned. A production deploy that forgot to set `BETTER_AUTH_SECRET` would not crash at boot. It would happily start, sign cookies with the placeholder, and serve traffic — until someone noticed sessions never validated. **Fail-fast at the deploy boundary** is the principal-engineer pattern; **fail-soft into a useless state** is the anti-pattern.

### 2. Build artifacts should not depend on runtime secrets

The fact that the build needed *any* value for `BETTER_AUTH_SECRET` — even a fake one — was a sign that build-time and runtime concerns were tangled. A compiled `.svelte-kit/output/` doesn't sign cookies. It doesn't need a secret. The compile step should never read runtime env vars.

### 3. CI workflows shouldn't need fake secrets

The original CI workflow had:

```yaml
env:
  CI_BETTER_AUTH_SECRET: ${{ secrets.CI_BETTER_AUTH_SECRET }}
```

…with a "fake but valid" secret stored in repo secrets. That's a smell. The fix to the build (lazy init) makes that secret unnecessary. The CI workflow can drop it.

---

## Pros and cons of each approach

### Approach A — placeholder fallback (what we shipped first, now reverted)

**Pros**
- Tiny diff. One file.
- No call-site changes — everything still imports `auth` directly.
- TypeScript type fidelity preserved.

**Cons**
- Silent misconfiguration in production is possible if NODE_ENV check is bypassed or wrong.
- Build still implicitly depends on env (even if placeholder).
- The placeholder string lives in the codebase forever as a reminder of the workaround.
- "Sessions WILL NOT WORK" warning is easy to ignore in dev when the dev never hits a sign-in flow.
- Fails the principle of least surprise: a future engineer reading the code sees `secret: resolvedSecret` and has to chase down a closure to learn the secret might be a fixed string.

### Approach B — lazy `getAuth()` (now shipped)

**Pros**
- **Zero side effects at module import.** Builds, tests, type-checks, and Drizzle Studio all run without env vars.
- **Hard failure on missing secret in production.** No silent fallback. Throws `Missing required environment variable: BETTER_AUTH_SECRET` on the first request.
- CI doesn't need a fake `CI_BETTER_AUTH_SECRET`. The workflow can drop that env injection.
- Memoization keeps the runtime cost identical to the eager version after the first call.
- Pattern matches Linear's `getAuth()`, Stripe's `getStripe()`, and our own `src/lib/server/stripe/client.ts` already-existing pattern. Consistency.

**Cons**
- 7 call sites had to change. Mechanical but real.
- One more layer of indirection at every call site (`getAuth().api.x` instead of `auth.api.x`).
- Pattern requires discipline: anyone adding a new consumer must remember to call `getAuth()`. A future contributor who blindly imports `auth` will get a "module has no export" error at compile time, which is at least loud — but it's still one more thing to know.
- Can mask a different class of bug: if a new env var is required in `buildAuth()` and the developer adds it but forgets to set it, it fails at first request instead of at boot. Mitigation: add a startup sanity check (see "Future hardening" below).

### Approach C — validated env contract (Pattern A in my prior message)

This is what Microsoft/Apple/large enterprise SaaS shops typically prefer at the org level: a single `env.ts` module that parses `process.env` against a Valibot/Zod schema at startup, hard-failing on any missing or malformed variable.

**Pros**
- Single source of truth for what's required.
- Hard fail at boot — never serves a request with bad config.
- Schema doubles as `.env.example` documentation.

**Cons**
- Doesn't solve the build problem on its own — the schema parser still runs at module init and crashes during analyse if vars aren't set.
- Requires either (a) always supplying valid env at build time (which we don't want — see Pro #2 above), or (b) lazy initialization combined with the schema (Approach B + C).

**Recommendation:** layer Approach C on top of Approach B in a future iteration. Both patterns are compatible. For now, Approach B alone is sufficient and rigorous.

---

## What I need from you for production

Below is the full deploy checklist. Items are ordered so each one unblocks the next.

### 1. External accounts (free / paid as noted)

| Service | Why | Plan | Time |
|---|---|---|---|
| **Neon** | Production Postgres | Free tier (sufficient until ~10K active users) → upgrade to Pro when you cross | 5 min |
| **Vercel** | Hosting + edge + preview deploys | Hobby (free) → Pro ($20/mo) when you launch publicly | already linked |
| **Stripe** | Payments | Free; pay 2.9% + 30¢ per transaction | 15 min |
| **Resend** | Transactional email | Free 3K/mo, $20 for 50K | 10 min (need DNS access for SPF/DKIM) |
| **Anthropic** | AI co-pilot | Pay-as-you-go; $5 free credit on signup | 5 min |
| **Sentry** | Error + perf monitoring | Free 5K errors/mo, $26/mo for 50K | 10 min |
| **Upstash** | Redis (rate limiting) | Free 10K cmds/day, $0.20/100K after | 5 min |
| **GitHub OAuth** | "Continue with GitHub" sign-in | Free | 5 min |
| **Google OAuth** | "Continue with Google" sign-in | Free | 10 min (verification screen for prod scope) |
| **Domain registrar** | `lumen.so` apex + wildcard | ~$50/yr | 5 min if available |

Total realistic cost for first 6 months: **~$50 domain + $0–$20 Vercel = under $100** until you cross meaningful tier limits.

### 2. Generate every required secret

```bash
# 32-byte session signing secret
openssl rand -base64 32                 # → BETTER_AUTH_SECRET

# Cookie domain (production only — leaves cookies scoped to apex + subdomains)
echo ".lumen.so"                        # → LUMEN_COOKIE_DOMAIN

# Tauri auto-updater key (only if you ship desktop binaries)
pnpm tauri signer generate              # writes private key locally; copy public to tauri.conf.json
```

### 3. Provision Neon

1. Create project named `lumen-prod` at <https://console.neon.tech>.
2. In **Settings → Compute**, enable autosuspend (5 min idle) and autoscaling.
3. From the dashboard, copy the **pooled** connection string. Use it as the production `DATABASE_URL`.
4. Apply the schema:
   ```bash
   DATABASE_URL=postgres://…neon.tech/… pnpm db:migrate
   ```
5. **Do not seed production.** The seed script refuses to run against any URL containing `prod` in the hostname (defense-in-depth) — but never run it against this URL anyway.

### 4. Provision Stripe

```bash
# 1. Get keys from https://dashboard.stripe.com/apikeys (live mode!)
#    Copy: sk_live_... and pk_live_...

# 2. Sync the catalog (DB → Stripe)
DATABASE_URL=<prod neon> STRIPE_SECRET_KEY=sk_live_… pnpm stripe:sync

# 3. Create the production webhook endpoint at
#    https://dashboard.stripe.com/webhooks → Add endpoint
#      URL:    https://lumen.so/api/webhooks/stripe
#      Events: customer.subscription.*, invoice.*, payment_method.*, checkout.session.completed
#    Copy the signing secret it gives you. That's STRIPE_WEBHOOK_SECRET.

# 4. (Optional but recommended) Configure the customer portal at
#    https://dashboard.stripe.com/settings/billing/portal
#    Allow: cancel, update plan, view invoices, update payment method.
```

### 5. Provision Resend

1. Sign up at <https://resend.com>.
2. In **Domains**, add `lumen.so` and follow the DKIM + SPF setup (3 DNS records).
3. Wait for verification (usually under 5 min).
4. **API Keys** → create a key scoped to "Send emails." Copy as `RESEND_API_KEY`.
5. In `EMAIL_FROM` use `Lumen <no-reply@lumen.so>` (or whichever subdomain you verified).

### 6. Provision OAuth

#### Google
1. <https://console.cloud.google.com/apis/credentials> → "Create Credentials" → "OAuth 2.0 Client ID" → Web Application.
2. Authorized redirect URIs:
   - `https://lumen.so/api/auth/callback/google`
   - `https://*.vercel.app/api/auth/callback/google` (preview deploys)
3. Copy client ID + secret.
4. **OAuth consent screen**: complete the Google verification flow (required for non-test users). Submit for verification — takes 1–5 days.

#### GitHub
1. <https://github.com/settings/developers> → "New OAuth App."
2. Authorization callback URL: `https://lumen.so/api/auth/callback/github`.
3. Generate a client secret. Copy.

### 7. Provision Anthropic

1. <https://console.anthropic.com> → **API Keys** → "Create Key."
2. Name: `lumen-production`.
3. Copy as `ANTHROPIC_API_KEY` (`sk-ant-api03-…`).
4. Set spend limit in **Plans & Billing** to bound exposure.

### 8. Provision Sentry

1. <https://sentry.io> → "Create Project" → SvelteKit.
2. Copy the DSN as `PUBLIC_SENTRY_DSN`.
3. **Settings → Auth Tokens** → create a token with `project:write` scope. Copy as `SENTRY_AUTH_TOKEN` (used to upload sourcemaps during build).
4. Note your org + project slugs (`SENTRY_ORG`, `SENTRY_PROJECT`).

### 9. Provision Upstash

1. <https://console.upstash.com> → "Create database" → Redis → pick region near Vercel deploy.
2. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from the **REST API** tab.

### 10. Configure Vercel

In your Vercel project's **Settings → Environment Variables**, add the following for the **Production** environment (and **Preview** if you want previews to mirror):

```
NODE_ENV=production
DATABASE_URL=<from Neon, pooled connection>
DATABASE_URL_UNPOOLED=<from Neon, direct connection — used by db:migrate>
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=https://lumen.so
PUBLIC_LUMEN_RP_ID=lumen.so
LUMEN_COOKIE_DOMAIN=.lumen.so
LUMEN_TRUSTED_ORIGINS=https://lumen.so,https://*.lumen.so
GOOGLE_CLIENT_ID=<from Google>
GOOGLE_CLIENT_SECRET=<from Google>
GITHUB_CLIENT_ID=<from GitHub>
GITHUB_CLIENT_SECRET=<from GitHub>
RESEND_API_KEY=<from Resend>
EMAIL_FROM=Lumen <no-reply@lumen.so>
EMAIL_REPLY_TO=support@lumen.so
STRIPE_SECRET_KEY=sk_live_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_MODEL=claude-opus-4-7
PUBLIC_SENTRY_DSN=https://...@o000.ingest.sentry.io/000
SENTRY_AUTH_TOKEN=sntrys_...
SENTRY_ORG=billyribeiro-ux
SENTRY_PROJECT=lumen
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=AY...
```

Do **not** set `ALLOW_DESTRUCTIVE_DB_OPS` in production — leaving it unset is the kill switch that prevents seed/wipe scripts from running against prod.

### 11. Configure DNS

In your DNS provider (Cloudflare, Namecheap, etc.):

| Record | Type | Value |
|---|---|---|
| `lumen.so` apex | A or CNAME | Vercel's apex IPs / `cname.vercel-dns.com` |
| `*.lumen.so` wildcard | CNAME | `cname.vercel-dns.com` (for Phase 18 publishing subdomains) |
| `_acme-challenge` records | TXT | (Vercel manages automatically when you add the domain) |
| Resend SPF/DKIM | TXT | (3 records from Resend's domain setup screen) |
| `_dmarc.lumen.so` | TXT | `v=DMARC1; p=reject; rua=mailto:dmarc@lumen.so` |

Add the apex domain in Vercel's **Settings → Domains** and the wildcard. Vercel handles cert provisioning.

### 12. Drop the WOFF2 fonts

Per `src/lib/styles/fonts.css`, drop these binaries before the production build (sizes ~250KB each):

```
static/fonts/inter/InterVariable.woff2
static/fonts/jetbrains-mono/JetBrainsMono.woff2
static/fonts/literata/Literata.woff2
```

Sources:
- Inter: <https://github.com/rsms/inter/releases>
- JetBrains Mono: <https://www.jetbrains.com/lp/mono/>
- Literata: <https://fonts.google.com/specimen/Literata> (download → unzip → variable font)

Until these are in place, the page falls back to system fonts. Not a launch blocker, but the brand looks better with the real ones.

### 13. Merge the stack to `main`

Today there are 21 open PRs (#1–#19 stacked phases plus #20 docs and #21 build fix). Recommended merge order:

1. **#21** (build fix + local-dev) → main first; CI starts working
2. **#20** (PE7 build sequence doc) → main
3. **#1 → #19** in numeric order. Each phase's PR description includes the post-merge tag command.

Each merge → tag → release:

```bash
# After each PR merges to main:
git checkout main && git pull
git tag -a vX.Y.Z -m "vX.Y.Z — Phase N: <name>"
git push origin vX.Y.Z
gh release create vX.Y.Z --title "vX.Y.Z — Phase N: <name>" --generate-notes
```

Final tag is `v1.0.0` after Phase 14 (#15) merges. v1.1.0 → v1.4.0 follow as the desktop / AI / graph / publish PRs merge.

### 14. First production deploy

Once `main` has all phases merged and Vercel has the env vars:

1. Vercel auto-deploys on push to `main`.
2. Watch the build logs — should be green now that lazy auth init removes the env requirement at build time.
3. After deploy, hit `https://lumen.so/sign-up` and create the very first user (you).
4. In Neon's SQL editor, promote yourself to org owner and assign yourself a Studio entitlement:
   ```sql
   -- Replace <your-user-id>:
   INSERT INTO organizations (id, name, slug, description, owner_id)
     VALUES (gen_random_uuid(), 'Lumen', 'lumen', 'Lumen — first organization.', '<your-user-id>')
     RETURNING id;
   -- Use the returned <org-id>:
   INSERT INTO memberships (user_id, organization_id, role) VALUES ('<your-user-id>', '<org-id>', 'owner');
   INSERT INTO entitlements (user_id, organization_id, tier) VALUES ('<your-user-id>', '<org-id>', 'studio');
   ```
5. Sign in. Verify ⌘K, ⌘N, theme cycle (⌘⇧T), `/account/security`, `/account/billing` all load.
6. Smoke-test checkout: visit `/pricing` → click "Pro" → complete with a real card → confirm subscription appears in Stripe + DB.
7. Refund the smoke-test charge (`stripe refunds create --charge ch_…`).

### 15. Ongoing operations

After the launch deploy:

- **Daily**: check Sentry for new error groups.
- **Weekly**: review Stripe failed payments + dunning.
- **Per release**: run `pnpm db:check` against production to catch schema drift; never use `pnpm db:push` in production (forbidden — `pnpm db:migrate` only).
- **Per dependency upgrade**: run the full `pnpm test` + `pnpm test:e2e` suite locally; don't trust dependabot blindly.
- **Quarterly**: rotate `BETTER_AUTH_SECRET`, `STRIPE_WEBHOOK_SECRET`, `ANTHROPIC_API_KEY`. Quarterly secret rotation is industry standard.

---

## Future hardening (post-v1.0.0)

These are enhancements to the auth lazy-init pattern that are out of scope for this PR but worth tracking:

### A. Add a startup sanity check

`hooks.server.ts` currently calls `getAuth()` lazily at first request. This means a misconfiguration (missing `BETTER_AUTH_SECRET`) is caught at first traffic, not at boot.

**Better:** add a `+server.ts` health-check endpoint (`/api/health`) that calls `getAuth()` during boot via Vercel's health probe. Vercel's deploy checks this endpoint before flipping traffic. A misconfigured deploy never serves a single user.

### B. Add a typed env contract

Layer Approach C on top of B. Create `src/lib/server/env.ts`:

```ts
import * as v from 'valibot';

const Schema = v.object({
  DATABASE_URL: v.pipe(v.string(), v.url()),
  BETTER_AUTH_SECRET: v.pipe(v.string(), v.minLength(32)),
  BETTER_AUTH_URL: v.pipe(v.string(), v.url()),
  // … one entry per required var
});

let _env: v.InferOutput<typeof Schema> | null = null;

export function getEnv() {
  if (!_env) _env = v.parse(Schema, process.env);
  return _env;
}
```

Then `buildAuth()` reads `getEnv().BETTER_AUTH_SECRET` instead of `required('BETTER_AUTH_SECRET')`. Single source of truth for what the runtime needs. Schema doubles as documentation.

### C. Promote the same pattern to the other server modules

`src/lib/server/stripe/client.ts` already uses a lazy `getStripe()`. `src/lib/server/email/index.ts` uses a top-level Resend client and could benefit from the same getter pattern. Same with `src/lib/server/observability.ts`. Not blocking, but worth converging.

---

## Verification

```bash
# Type-check passes
pnpm check                     # 2954 files, 0 errors, 0 warnings

# Build passes with NO env vars set
unset BETTER_AUTH_SECRET DATABASE_URL && pnpm build
# → Successful

# Lint clean
pnpm biome check .             # 101 files clean (4 pre-existing warnings unrelated to this PR)

# Existing test suite passes
pnpm test:unit --run           # 16 / 16 passing
```

---

## Related

- ADR-004 — Authentication: Better Auth.
- `src/lib/server/auth.ts` — the implementation.
- `docs/runbooks/local-dev.md` — local-dev quick-start.
- `docs/PRE_LAUNCH.md` — PE7 build sequence reference.
- PR #21 — the predecessor (placeholder fallback) that this PR supersedes.
