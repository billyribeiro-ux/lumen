# Runbook — Local development from zero

Get Lumen running locally in 5 minutes. No external accounts required for
the core auth + CRUD + AI-disabled experience; Stripe + Anthropic + OAuth
plug in incrementally.

---

## 0. Prereqs

```bash
# Node 22+, pnpm 10+, Docker (or Neon free tier instead)
node --version       # v22.x or v24.x
pnpm --version       # 10.x
docker --version     # any recent
```

---

## 1. Clone + install

```bash
git clone https://github.com/billyribeiro-ux/lumen.git
cd lumen
corepack enable
pnpm install
```

---

## 2. Pick a database path

### 2a. Neon dev branch (recommended — driver matches prod)

1. Sign up at [console.neon.tech](https://console.neon.tech) (free tier).
2. Create a project. Note the pooled `DATABASE_URL` from the dashboard.
3. Paste into `.env` (next step).

### 2b. Local Docker Postgres (fully offline)

```bash
docker compose up -d        # spins up postgres + redis
```

Then in `src/lib/server/db/index.ts`, swap the driver from
`@neondatabase/serverless` (HTTP) to `pg` (TCP):

```ts
// before:
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
export const db = drizzle(neon(DATABASE_URL), { schema, casing: 'snake_case' });

// after — Docker Postgres:
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
export const db = drizzle(new Pool({ connectionString: DATABASE_URL }), {
  schema,
  casing: 'snake_case',
});
```

(The Neon driver works against any Postgres URL but its HTTP transport
expects Neon's edge proxy — local Docker Postgres needs a TCP driver.)

---

## 3. Configure `.env`

Copy the template and fill in the **required** vars only:

```bash
cp .env.example .env
```

Then edit `.env` so at minimum:

```bash
NODE_ENV=development

# Database — pick one
DATABASE_URL=postgres://user:password@ep-xxx.neon.tech/lumen?sslmode=require   # Neon
# DATABASE_URL=postgres://postgres:lumen@localhost:5432/lumen                  # Docker

# Auth — generate once with: openssl rand -base64 32
BETTER_AUTH_SECRET=replace-me-with-32-bytes-of-base64
BETTER_AUTH_URL=http://localhost:5173
PUBLIC_LUMEN_RP_ID=localhost

# Required for seed/wipe scripts
ALLOW_DESTRUCTIVE_DB_OPS=true

# Everything else is optional in dev — leave blank, code no-ops:
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# GITHUB_CLIENT_ID=
# GITHUB_CLIENT_SECRET=
# RESEND_API_KEY=               # email logs to stderr without this
# STRIPE_SECRET_KEY=             # /pricing renders, /api/checkout 503s
# PUBLIC_STRIPE_PUBLISHABLE_KEY=
# STRIPE_WEBHOOK_SECRET=
# ANTHROPIC_API_KEY=             # /ai shows "not configured" without this
# UPSTASH_REDIS_REST_URL=        # rate limiter no-ops without these
# UPSTASH_REDIS_REST_TOKEN=
# PUBLIC_SENTRY_DSN=             # Sentry no-ops without DSN
```

---

## 4. Migrate + seed

```bash
pnpm db:migrate                                  # applies the 31-table schema
ALLOW_DESTRUCTIVE_DB_OPS=true pnpm db:seed       # 3 orgs, 15 personas, sample content
```

Or wipe + reseed any time:

```bash
ALLOW_DESTRUCTIVE_DB_OPS=true pnpm db:reset
```

---

## 5. Run the app

```bash
pnpm dev
```

Open <http://localhost:5173>. You'll be redirected to `/sign-in`.

Sign in with any seeded persona — all share the password `LumenDev2026!`:

| Email | Org | Role | Tier |
|---|---|---|---|
| `billy@lumen.so` | Lumen Labs | owner | studio |
| `sara@lumen.so` | Lumen Labs | admin | studio |
| `marcus@lumen.so` | Lumen Labs | editor | studio |
| `priya@lumen.so` | Lumen Labs | editor | studio |
| `james@lumen.so` | Lumen Labs | viewer | studio |
| `anna@indie.studio` | Indie Studio | owner | pro |
| `tomas@indie.studio` | Indie Studio | admin | pro |
| `elise@indie.studio` | Indie Studio | editor | pro |
| `david@indie.studio` | Indie Studio | viewer | pro |
| `rachel@hacker.io` | Free Hacker | owner | free |
| `trial-1@example.com` … `trial-5@example.com` | Trial workspaces | owner | pro-trial |

---

## 6. What works without external keys

| Feature | Without keys | With keys |
|---|---|---|
| Sign in / out (email + password) | ✅ | ✅ |
| Sign up | ✅ verification logs to stderr | ✅ verification email sent |
| Magic link | ✅ link logs to stderr | ✅ link sent |
| Passkeys | ✅ on localhost | ✅ |
| OAuth Google / GitHub | ❌ buttons present, redirect 404 | ✅ — needs `GOOGLE_*` / `GITHUB_*` |
| Node CRUD + command bar (⌘K) | ✅ | ✅ |
| Themes (⌘⇧T cycles) | ✅ | ✅ |
| Graph view (⌘ via /graph) | ✅ | ✅ |
| Tier gating | ✅ enforced from seed | ✅ |
| Pricing page | ✅ | ✅ |
| Checkout | ❌ 503 without Stripe | ✅ — needs `STRIPE_*` |
| Customer portal | ❌ no Stripe customer | ✅ |
| AI co-pilot (⌘J) | ❌ shows "not configured" | ✅ — needs `ANTHROPIC_API_KEY` |
| Public publishing | ✅ at `/p/<slug>` | ✅ |
| Rate limiting | ✅ no-op (allows all) | ✅ enforced |
| Sentry error tracking | ✅ no-op | ✅ |

---

## 7. Add external services as you need them

### Stripe (free, test mode)

```bash
# 1. Get test keys from https://dashboard.stripe.com/test/apikeys
# 2. Paste sk_test_... and pk_test_... into .env
# 3. Forward webhooks to local
brew install stripe/stripe-cli/stripe
stripe login
pnpm stripe:listen          # paste the printed whsec_... into .env as STRIPE_WEBHOOK_SECRET
pnpm stripe:sync            # creates products + prices in your test account
pnpm stripe:seed-customers  # opens active subscriptions for the seed personas
```

Full reference: [`docs/runbooks/stripe-testing.md`](./stripe-testing.md).

### OAuth (Google + GitHub)

| Provider | Where | Authorized redirect URI |
|---|---|---|
| Google | <https://console.cloud.google.com/apis/credentials> → "Create OAuth client ID" → Web application | `http://localhost:5173/api/auth/callback/google` |
| GitHub | <https://github.com/settings/developers> → New OAuth App | `http://localhost:5173/api/auth/callback/github` |

Paste the client id + secret into `.env`. The buttons on `/sign-in` start working immediately.

### Anthropic (AI co-pilot)

```bash
# Sign up at https://console.anthropic.com — $5 free credit on signup.
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_MODEL=claude-opus-4-7    # default; override if needed
```

Hit `/ai` (or `⌘J` once the binding is wired in the topbar) — the chat
panel will use prompt caching on the system prompt + grounding block.

### Resend (email)

Without a key, every email logs to stderr — fine for dev. To actually
send:

```bash
# 1. Sign up at https://resend.com (free 100 emails/day for developers)
# 2. Verify your sending domain (or use onboarding@resend.dev for testing)
# 3. Add to .env:
RESEND_API_KEY=re_...
EMAIL_FROM='Lumen <no-reply@your-verified-domain>'
EMAIL_REPLY_TO=support@your-verified-domain
```

### Upstash Redis (rate limiting)

Without a key, the rate limiter no-ops. To enforce:

```bash
# 1. Sign up at https://console.upstash.com (free tier)
# 2. Create a Redis database; copy the REST URL + token
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AY...
```

### Sentry (error tracking)

```bash
# 1. Sign up at https://sentry.io (free 5k errors/month)
# 2. Create a SvelteKit project; copy the DSN.
PUBLIC_SENTRY_DSN=https://...@o000.ingest.sentry.io/000
SENTRY_AUTH_TOKEN=         # only needed for sourcemap upload during build
```

---

## 8. Reset to clean slate any time

```bash
ALLOW_DESTRUCTIVE_DB_OPS=true pnpm db:reset    # nukes + reseeds the DB
docker compose down -v                          # wipes Docker volumes (if using Docker path)
```

---

## Related

- [`docs/runbooks/database-migrations.md`](./database-migrations.md)
- [`docs/runbooks/database-seeding.md`](./database-seeding.md)
- [`docs/runbooks/stripe-testing.md`](./stripe-testing.md)
- [`docs/runbooks/desktop-release.md`](./desktop-release.md)
- [`.env.example`](../../.env.example) — every var documented
