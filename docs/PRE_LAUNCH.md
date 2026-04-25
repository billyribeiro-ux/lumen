# The Complete PE7 SaaS Build Sequence

### How Distinguished Principal Engineers Ship Production SaaS Applications

**Author's note:** This is the sequence. Every phase is a hard topological dependency of the next. You don't skip. You don't reorder. You don't build top-down. You build ground-up — database first, UI last — because the layers above know what the layers below look like, not the other way around.

This is how apps are built at Apple, Microsoft, Meta, Stripe, Linear, Vercel, and every serious engineering org. It's also how a single principal engineer ships alone without drowning.

---

## The Prime Directive

> **Every layer depends on the layer below it being rock solid. You never touch Stripe before your schema is clean. You never build UI before your server contracts are defined. You never ship without tests. This is not a tutorial — this is how distinguished engineers ship software that survives.**

---

## The Dependency Chain

Phases are not arbitrary. They follow strict topological order — each phase is a hard dependency of the one above it:

```
Schema
  └── Seeding (needs schema to exist)
        └── Auth (needs schema + seeds for test users)
              └── RBAC (needs auth session + user record)
                    └── Validation (needs error types + RBAC)
                          └── CRUD (needs schema + RBAC + validation)
                                └── Email (needs user record)
                                      └── Stripe Foundation (needs schema + email)
                                            └── Billing Services (needs Stripe + schema)
                                                  └── Stripe Seeding (needs products + prices)
                                                        └── Checkout (needs billing services)
                                                              └── Customer Portal (needs subscriptions)
                                                                    └── Tier Access (needs subscriptions)
                                                                          └── Testing (needs all of the above)
```

### Why skipping is fatal

- **Skip seeding** → you have no way to test auth, because there are no users.
- **Skip auth** → RBAC has no session to gate, no user to identify.
- **Skip RBAC** → your CRUD endpoints have no access control; you ship public writes.
- **Skip validation** → your database gets garbage data and SQL injection sneaks through.
- **Skip CRUD tests** → your billing layer assumes CRUD works; when it doesn't, you debug backwards.
- **Skip tier access** → paying customers and free users have identical feature sets; why would anyone pay?

The sequence is not a suggestion. It is the build order.

---

## Table of Contents

1. [Phase 0 — Foundation & Environment](#phase-0--foundation--environment)
2. [Phase 1 — Database Schema Design](#phase-1--database-schema-design)
3. [Phase 2 — Database Seeding Strategy](#phase-2--database-seeding-strategy)
4. [Phase 3 — Authentication](#phase-3--authentication)
5. [Phase 4 — RBAC & Permission System](#phase-4--rbac--permission-system)
6. [Phase 5 — Input Validation & Security Layer](#phase-5--input-validation--security-layer)
7. [Phase 6 — Core CRUD](#phase-6--core-crud)
8. [Phase 7 — Email Service](#phase-7--email-service)
9. [Phase 8 — Stripe Foundation & Dynamic Pricing](#phase-8--stripe-foundation--dynamic-pricing)
10. [Phase 9 — Billing Services](#phase-9--billing-services)
11. [Phase 10 — Stripe & Plan Seeding](#phase-10--stripe--plan-seeding)
12. [Phase 11 — Pricing Page & Checkout](#phase-11--pricing-page--checkout)
13. [Phase 12 — Customer Portal](#phase-12--customer-portal)
14. [Phase 13 — Tier-Based Access Control](#phase-13--tier-based-access-control)
15. [Phase 14 — Testing & CI/CD Hardening](#phase-14--testing--cicd-hardening)
16. [Release Cadence](#release-cadence)
17. [The Non-Negotiables](#the-non-negotiables)

---

## Stack Declaration (Paste at the Top of Every Claude Code Session)

Before any coding session starts, paste your stack declaration. This is what Apple and Microsoft call "the contract" — it tells every contributor (human or AI) exactly what tools are in play and what patterns are forbidden.

```markdown
# Stack Declaration

- **Framework:** [e.g. SvelteKit 2.57 + Svelte 5.55 runes]
- **Language:** TypeScript strict mode
- **Database:** [e.g. Neon Postgres]
- **ORM:** [e.g. Drizzle 0.44]
- **Auth:** [e.g. Better Auth 1.6]
- **Validation:** [e.g. Valibot 1.x]
- **Forms:** [e.g. sveltekit-superforms 2.30]
- **UI primitives:** [e.g. Bits UI 2.17]
- **Styling:** [Design token system — e.g. OKLCH, @layer, logical properties]
- **Payments:** Stripe — DYNAMIC PRICING FROM DATABASE (DB is source of truth)
- **Email:** [e.g. Resend]
- **Package manager:** [e.g. pnpm exclusive — never npm, yarn, bun]
- **Deployment:** [e.g. Vercel]

## Forbidden patterns
- Top-down builds (UI before schema)
- Hardcoded prices or product IDs
- Client-side RBAC as the only check
- Skipping seeds, migrations, or tests
- Committing .env files
- `any` type in TypeScript
- Console.log in committed code
```

---

## Phase 0 — Foundation & Environment

**Goal:** A clean repo that a new engineer can clone and understand in 15 minutes.

### What ships in this phase

1. **Repository initialization**
   - Git repo created with remote set
   - `main` branch protected, PR-only merges
   - `develop` as integration branch (if using GitFlow)

2. **Documentation baseline** — the files every serious project ships with:
   - `README.md` — what the product is, how to run it, stack summary
   - `LICENSE` — MIT, Apache-2.0, or proprietary
   - `.gitignore` — comprehensive (node_modules, build, .env, OS, editors, secrets)
   - `.env.example` — every env var documented, organized by phase, with generation instructions
   - `CHANGELOG.md` — Keep a Changelog 1.1.0 format, Semantic Versioning 2.0.0
   - `SECURITY.md` — vulnerability disclosure policy, supported versions, contact
   - `CONTRIBUTING.md` — branch strategy, Conventional Commits, coding standards, PR process
   - `CODE_OF_CONDUCT.md` — Contributor Covenant 2.1
   - `ROADMAP.md` — public phase-by-phase timeline
   - `ARCHITECTURE.md` — system design, data flow, security model, performance budget
   - `.github/PULL_REQUEST_TEMPLATE.md`
   - `.github/ISSUE_TEMPLATE/bug_report.md`
   - `.github/ISSUE_TEMPLATE/feature_request.md`
   - `.github/ISSUE_TEMPLATE/config.yml` (routes questions to Discussions)
   - `docs/adr/000-template.md` — ADR template
   - `docs/adr/001-meta-framework.md` (onward) — every architectural decision recorded
   - `docs/BUILD_LOG.md` — chronological file creation log

3. **Design system specification (CRITICAL)**
   - `docs/DESIGN_TOKENS.md` — this is the equivalent of Material Design / Fluent / HIG
   - Full color palette for every theme (OKLCH values, semantic tokens)
   - Typography scale (sizes, weights, line-heights, letter-spacing)
   - Spacing scale (fluid `clamp()` values)
   - Elevation / shadow system
   - Radius scale
   - Motion tokens (durations, easings)
   - Focus ring spec
   - Breakpoint system
   - **This ships in Phase 0, not Phase 6. Engineering builds against the system; designers own it.**

4. **Tooling configuration**
   - `biome.json` (or `.eslintrc` + `.prettierrc`) — lint + format
   - `lefthook.yml` (or `.husky/`) — pre-commit hooks
   - `commitlint.config.js` — Conventional Commits enforcement
   - `.gitleaks.toml` — secret detection
   - `tsconfig.json` — strict mode enabled
   - `package.json` — locked to specific runtime versions, `packageManager` field

5. **Initial CI/CD**
   - GitHub Actions workflow: lint → type check → test → build on every PR
   - Preview deployment per PR (Vercel / Netlify / Cloudflare Pages)
   - Secret storage in platform env (never committed)

### Commit cadence

```bash
# Each file is one commit. Conventional Commits format.
git commit -m "docs: add project README with overview and stack
git commit -m "chore: add MIT license"
git commit -m "chore: add comprehensive .gitignore"
git commit -m "chore: add .env.example with phase-organized variables"
# ...etc
```

### Phase 0 release

When documentation baseline is complete:

```bash
git tag -a v0.1.0 -m "v0.1.0 — Phase 0: Foundation"
git push origin v0.1.0
gh release create v0.1.0 --title "v0.1.0 — Foundation" --notes "Initial repository baseline..."
```

---

## Phase 1 — Database Schema Design

**Goal:** Every table, column, index, and relationship needed by the entire application, defined in code.

### Why schema first

The schema is the **shape** of your application. Every layer above it — auth, validation, CRUD, billing — is structured around what the database looks like. If you build auth before schema, you'll define a `users` table twice and have to reconcile. If you build UI before schema, you'll ship a component that binds to fields your database doesn't have. Schema first eliminates rework.

### What ships in this phase

1. **Framework scaffold**
   - Run the framework's CLI (e.g. `sv create`, `npx create-next-app`, `nuxi init`)
   - Select TypeScript strict, your adapter (Vercel/Node/Cloudflare), testing (Vitest + Playwright)
   - Commit the scaffold as-is before modifying

2. **ORM + database driver installation**
   - Install Drizzle (or Prisma, Kysely — your choice, recorded in ADR)
   - Install the database-specific driver (`@neondatabase/serverless`, `pg`, `postgres.js`)
   - Configure `drizzle.config.ts` (or equivalent) pointing to your schema directory

3. **Schema directory structure**
   ```
   src/lib/server/db/
   ├── index.ts                 # Drizzle instance factory
   └── schema/
       ├── index.ts             # Re-exports all schema modules
       ├── auth.ts              # users, sessions, accounts, verification
       ├── organizations.ts     # organizations, memberships, invitations
       ├── rbac.ts              # roles, permissions, role_permissions
       ├── [domain-1].ts        # Your core domain tables
       ├── [domain-2].ts
       ├── billing.ts           # products, prices, subscriptions, invoices, entitlements
       ├── audit.ts             # audit_log
       └── webhooks.ts          # webhook_events (idempotency store)
   ```

4. **Every table must have:**
   - UUID primary key (`id uuid primary key default gen_random_uuid()`)
   - `created_at timestamptz not null default now()`
   - `updated_at timestamptz not null default now()` with trigger or ORM-managed
   - `deleted_at timestamptz` for soft delete on user-facing resources
   - `organization_id` foreign key on every multi-tenant table
   - Foreign keys explicitly indexed
   - Appropriate unique constraints
   - JSONB columns for flexible metadata where needed

5. **Initial migration**
   ```bash
   pnpm drizzle-kit generate --name=initial_schema
   ```
   - Inspect the generated SQL. Read it. Understand it.
   - Commit the migration file alongside schema changes (never separate commits).

6. **Database connection module**
   - `src/lib/server/db/index.ts` exports a Drizzle instance
   - Reads `DATABASE_URL` from environment (via framework's env module — never `process.env` directly)
   - Uses pooled connection for app, unpooled for migrations

7. **Operational runbook**
   - `docs/runbooks/database-migrations.md`
   - How to add a migration, how to roll back
   - **The zero-downtime migration rule:** every migration must be forward-compatible for one version. Dropping a column or renaming a table requires two deploys (add new shape → dual-write → remove old shape).

### Phase 1 acceptance criteria

- `pnpm db:generate` produces a clean migration.
- `pnpm db:migrate` applies it against a fresh database.
- `pnpm db:studio` opens Drizzle Studio and shows every table.
- No application code queries the database yet. Schema is defined; usage comes next.

---

## Phase 2 — Database Seeding Strategy

**Goal:** Reproducible local development data. A new engineer runs `pnpm db:reset && pnpm db:seed` and has a working, realistic local environment in 30 seconds.

### Why seeding is non-negotiable

You cannot test auth without users. You cannot test RBAC without roles assigned. You cannot test billing flows without plans defined. You cannot demo the product without content. **Seeding is infrastructure, not a nice-to-have.**

### The four distinct seeding concerns

#### 2.1 — Auth user seeding

Fake users spanning every role and tier, with known passwords (for local dev only). These are test personas, not production data.

```ts
// drizzle/seed/personas.ts
export const personas = [
  { email: 'admin@example.test',   password: 'TestPass!234', role: 'owner',  tier: 'studio' },
  { email: 'billing@example.test', password: 'TestPass!234', role: 'admin',  tier: 'pro' },
  { email: 'editor@example.test',  password: 'TestPass!234', role: 'editor', tier: 'pro' },
  { email: 'viewer@example.test',  password: 'TestPass!234', role: 'viewer', tier: 'free' },
  { email: 'trial@example.test',   password: 'TestPass!234', role: 'owner',  tier: 'trial' },
  // ... 10-15 personas covering every combination
];
```

**Critical rules:**
- Never use realistic email domains that could accidentally send real emails during dev.
- Use `.test`, `.local`, or `.example` TLDs — they're RFC-reserved for exactly this purpose.
- Never commit real passwords — seed passwords are public, only used locally.
- Guard seed scripts with an environment check: `if (process.env.NODE_ENV === 'production') throw new Error('no')`.

#### 2.2 — Plan / product seeding

Your tier definitions (Free, Pro, Studio, Enterprise) are **data**, not code. They live in the `products` and `prices` tables.

```ts
// drizzle/seed/plans.ts
export const products = [
  { slug: 'free',    name: 'Free',    description: 'Try it, keep it' },
  { slug: 'pro',     name: 'Pro',     description: 'For professionals' },
  { slug: 'studio',  name: 'Studio',  description: 'For teams' },
];

export const prices = [
  { product_slug: 'pro',    interval: 'month', amount_cents: 2000 },
  { product_slug: 'pro',    interval: 'year',  amount_cents: 19200 }, // $192 = $16/mo
  { product_slug: 'studio', interval: 'month', amount_cents: 4000 },
  { product_slug: 'studio', interval: 'year',  amount_cents: 38400 },
];
```

The pricing page renders from this table. The checkout flow passes these price IDs to Stripe. **Stripe never defines pricing — the database does.**

#### 2.3 — Stripe seeding (Phase 10 concern, referenced here)

This is handled in Phase 10 after Stripe foundation exists. A sync script reads from the `products` and `prices` tables and creates or updates matching Stripe products / prices via the Stripe API. The local `products.stripe_product_id` column gets populated. One direction: DB → Stripe. Never the reverse.

#### 2.4 — CRUD / content seeding

Sample user-generated content so the local app looks alive:

- 5-10 sample projects per persona
- 20-50 sample records per user (notes, tasks, whatever your domain is)
- Tags, relationships, attachments
- Realistic timestamps (spread over the last 30 days, not all at `now()`)

### Seed script structure

```
drizzle/seed/
├── index.ts          # Orchestrator — calls each seeder in order
├── personas.ts       # Auth user seeding
├── plans.ts          # Product + price seeding
├── permissions.ts    # RBAC role + permission seeding
├── content.ts        # CRUD data seeding (per persona)
└── stripe-sync.ts    # Stripe sync (invoked in Phase 10, not Phase 2)
```

### Package.json scripts

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate":  "drizzle-kit migrate",
    "db:seed":     "tsx drizzle/seed/index.ts",
    "db:reset":    "tsx drizzle/reset.ts && pnpm db:migrate && pnpm db:seed",
    "db:studio":   "drizzle-kit studio"
  }
}
```

### Phase 2 acceptance criteria

- `pnpm db:reset` wipes + migrates + seeds in under 30 seconds.
- Every persona from `personas.ts` can authenticate after Phase 3 ships.
- `products` and `prices` tables contain the full tier catalog.
- Sample CRUD data is visible in Drizzle Studio.

---

## Phase 3 — Authentication

**Goal:** Users can sign up, sign in, sign out, verify email, reset password, and enable passkeys + 2FA. Sessions are server-authoritative.

### What ships in this phase

1. **Auth library installation**
   - Install Better Auth, Lucia, Auth.js, Clerk, or your choice (documented in ADR)
   - Configure its Drizzle adapter (or equivalent)
   - Run its schema generation if applicable (`better-auth generate`)

2. **Supported factors (pick what your product needs)**
   - Email + password (Argon2id hashing — never MD5, never SHA1, never plain bcrypt at low cost)
   - Passkeys (WebAuthn) — preferred over passwords for new signups
   - TOTP 2FA — opt-in
   - OAuth (Google, GitHub, Apple, etc.)
   - Magic link sign-in (one-time email link)

3. **Session policy**
   - Sessions stored in database (never JWT-only — JWTs can't be revoked)
   - 30-day sliding expiration, revocable per device
   - HttpOnly + Secure + SameSite=Lax cookies
   - Session invalidation on password change, 2FA change, manual sign-out

4. **Server hooks**
   - `hooks.server.ts` (SvelteKit) or middleware (Next.js) reads the session cookie
   - Hydrates `event.locals.user` and `event.locals.session`
   - Applies route-level guards: `/account/*` requires auth, `/admin/*` requires admin role

5. **Auth UI routes**
   - `/auth/sign-in`
   - `/auth/sign-up`
   - `/auth/forgot-password`
   - `/auth/reset-password/[token]`
   - `/auth/verify-email/[token]`
   - `/account/security` (change password, manage 2FA, manage passkeys, revoke sessions)

6. **Audit events**
   - Every sign-in, sign-up, password change, 2FA enable/disable writes to `audit_log`
   - Store IP, user agent, timestamp, event type

### Phase 3 acceptance criteria

- A fresh visitor can sign up at `/auth/sign-up` and land in the app authenticated.
- All seeded personas from Phase 2 can sign in.
- Passwords are hashed with Argon2id; no plaintext in the database.
- Sessions appear in the database and are invalidated on sign-out.
- Email verification emails queue (actual sending stubbed until Phase 7).

---

## Phase 4 — RBAC & Permission System

**Goal:** Every server action can check "can this user perform this action on this resource?" in one line. Permissions are enforced server-side; client-side gating is cosmetic only.

### The two scopes

1. **Organization-level roles** — `owner`, `admin`, `editor`, `viewer`
   - Owner: billing, delete org, transfer ownership
   - Admin: invite users, manage team, modify settings
   - Editor: create / edit / delete content
   - Viewer: read-only

2. **Resource-level roles** — same role names, scoped to a single project or document
   - A user can be `owner` of one project and `viewer` of another within the same org.

### What ships in this phase

1. **Schema additions (already in Phase 1 but activated now)**
   - `roles` — predefined role names and descriptions
   - `permissions` — fine-grained actions (`node.create`, `node.delete`, `billing.view`)
   - `role_permissions` — which permissions each role has
   - `memberships` — user ↔ organization with role
   - `project_memberships` — user ↔ project with role (optional second tier)

2. **Permission check helper**

   ```ts
   // src/lib/server/auth/permissions.ts
   export async function can(
     userId: string,
     action: Permission,
     resource?: { type: string; id: string }
   ): Promise<boolean> {
     // 1. Load user's org memberships
     // 2. Load resource-level permissions if resource provided
     // 3. Intersect against required permission
     // 4. Return boolean
   }

   export async function requirePermission(
     locals: App.Locals,
     action: Permission,
     resource?: { type: string; id: string }
   ): Promise<void> {
     if (!locals.user) throw error(401);
     const allowed = await can(locals.user.id, action, resource);
     if (!allowed) throw error(403);
   }
   ```

3. **Three layers of enforcement (always all three)**

   1. **Route guard** in `hooks.server.ts` — redirects unauthenticated or unauthorized users off protected routes.
   2. **Server-side check at the handler** — `await requirePermission(locals, 'node.update', { type: 'node', id })` before any mutation.
   3. **UI-level gating** — disables or hides controls the user cannot use. *Cosmetic only. The server check is authoritative.*

4. **Never trust the client.** Ever. The client can be modified, proxied, or lied to. Every permission decision happens on the server.

### Phase 4 acceptance criteria

- Calling `requirePermission()` with an invalid role throws 403.
- A `viewer` persona cannot `POST` to a write endpoint, even with a valid session.
- UI disables the "Delete" button for viewers but the server would reject the request regardless.
- Every role-based decision is logged to `audit_log`.

---

## Phase 5 — Input Validation & Security Layer

**Goal:** Every boundary (form input, API request, webhook payload) is validated. Nothing unvalidated reaches the database.

### What ships in this phase

1. **Schema validation library**
   - Install Valibot, Zod, Arktype, or TypeBox (documented in ADR)
   - Create `src/lib/schemas/` directory

2. **A schema for every mutation**

   ```ts
   // src/lib/schemas/node.ts
   import * as v from 'valibot';

   export const createNodeSchema = v.object({
     title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
     type: v.picklist(['note', 'task', 'decision']),
     project_id: v.pipe(v.string(), v.uuid()),
     body: v.optional(v.pipe(v.string(), v.maxLength(50_000))),
   });

   export type CreateNodeInput = v.InferOutput<typeof createNodeSchema>;
   ```

3. **Form library integration**
   - Install `sveltekit-superforms` (or `react-hook-form`, `vee-validate` — match your framework)
   - Use the validator adapter for your schema lib (`valibotClient`, `zodResolver`, etc.)
   - Server-side: `superValidate(request, valibot(createNodeSchema))`
   - Client-side: `superForm(data.form, { validators: valibotClient(createNodeSchema) })`

4. **Error handling infrastructure**
   - Centralized error types: `ValidationError`, `PermissionError`, `NotFoundError`, `RateLimitError`
   - Error boundary component for the UI
   - Server error transformer that scrubs PII and sensitive fields before sending to Sentry

5. **CSRF protection**
   - Enable framework's built-in CSRF (SvelteKit's form actions have it by default)
   - Origin header check on all non-GET requests

6. **Rate limiting**
   - Install Upstash Redis (or equivalent)
   - Rate limit sign-in attempts (5 per 15 min per IP)
   - Rate limit sign-up (3 per hour per IP)
   - Rate limit password reset requests (3 per hour per email)
   - Rate limit AI queries (per-tier quota)

7. **Content Security Policy**
   - Set CSP headers in `hooks.server.ts`
   - Strict `default-src 'self'`
   - Explicit allowlist for Stripe (`js.stripe.com`), API endpoints, images
   - `object-src 'none'`, `base-uri 'self'`

8. **Audit log write helper**
   - `logAudit(actor, action, resource, before, after)` — append-only
   - Called from every mutating handler

### Phase 5 acceptance criteria

- Submitting an invalid form returns 400 with per-field errors.
- An attacker cannot bypass client validation — the server rejects the same payload.
- Rate limits trigger 429 responses with `Retry-After` headers.
- CSP headers present on every response.

---

## Phase 6 — Core CRUD

**Goal:** The actual product functionality. Users can create, read, update, and delete the domain objects your product is built around.

### What ships in this phase

1. **For each core domain object:**
   - Create endpoint (with permission check + validation)
   - Read endpoint (list + detail)
   - Update endpoint (with permission check + validation + audit log)
   - Delete endpoint (soft delete by default)

2. **Full-text search**
   - Postgres `tsvector` column + GIN index on searchable tables
   - Search endpoint with pagination + filters
   - Search UI (command bar, filters panel)

3. **UI components (built against the design tokens from Phase 0)**
   - List views with skeleton loading states
   - Detail views with inline editing
   - Empty states with onboarding hints
   - Error boundaries with retry actions

4. **Keyboard shortcut system**
   - Global shortcut registry in a runes-based (or equivalent) state module
   - Command bar (`⌘K` or similar) with fuzzy search
   - Shortcut conflict detection at registration time

5. **URL state**
   - Filters, search queries, selected items persist in the URL (`?filter=...&q=...`)
   - Shareable, bookmarkable, back-button-compatible

### Phase 6 acceptance criteria

- Every seeded persona can perform the CRUD actions their role permits.
- A viewer can read but cannot write.
- Deleted items are soft-deleted (still in DB with `deleted_at` set).
- Search returns relevant results under 200ms for a 10k-record dataset.

---

## Phase 7 — Email Service

**Goal:** Transactional emails send reliably. Welcome, verification, password reset, invites, receipts.

### What ships in this phase

1. **Email provider setup**
   - Install Resend, Postmark, or SendGrid SDK
   - Verify sending domain (SPF, DKIM, DMARC)
   - Configure `EMAIL_FROM` and `EMAIL_REPLY_TO`

2. **Template system**
   - Use React Email (Next.js), svelte-email (Svelte), or MJML
   - One template per email type:
     - Welcome
     - Email verification
     - Password reset
     - Magic link sign-in
     - Team invitation
     - Subscription receipt
     - Subscription canceled
     - Payment failed
     - Weekly digest (optional)

3. **Send helpers**
   - `sendEmail({ to, template, data })` — typed per template
   - Rate limiting per recipient (prevent abuse)
   - Retry logic with exponential backoff
   - Bounce + complaint handling (webhook from provider)

4. **User preferences**
   - `email_preferences` table: which email types the user receives
   - Unsubscribe tokens + single-click unsubscribe endpoint
   - Compliance with CAN-SPAM, GDPR

### Phase 7 acceptance criteria

- Signing up triggers a verification email that arrives in under 5 seconds.
- Clicking the verification link activates the user.
- Password reset flow end-to-end works.
- All emails render in Gmail, Outlook, Apple Mail, and mobile clients (Litmus or Email on Acid test).

---

## Phase 8 — Stripe Foundation & Dynamic Pricing

**Goal:** Stripe is connected. Webhook endpoint verifies signatures. Products and prices exist in Stripe, mirrored from the database.

### The Dynamic Pricing Principle

> **The database is the source of truth for pricing. Stripe is a payment processor.**

- `products` and `prices` tables in Postgres are authoritative.
- A sync script creates matching Stripe products and prices via the Stripe API.
- The pricing page renders from Postgres.
- Checkout sessions are created with DB-sourced `price_id`s.
- If you want to change a price, you change it in the DB, then run the sync. **No dashboard clicking.**

This pattern is standard at Linear, Vercel, Resend, and every serious SaaS. Dashboard-defined pricing is a liability — it breaks reproducibility, loses version history, and creates environment drift.

### What ships in this phase

1. **Stripe SDK setup**
   - Install `stripe` npm package
   - Create a lazy client factory (`src/lib/server/stripe/client.ts`)
   - Read `STRIPE_SECRET_KEY` from env, never hardcode

2. **Webhook endpoint skeleton**
   - `src/routes/api/webhooks/stripe/+server.ts`
   - Read raw request body (webhook signature verification requires unparsed body)
   - Call `stripe.webhooks.constructEvent()` with raw body + signature header + `STRIPE_WEBHOOK_SECRET`
   - Return 200 immediately on success; 400 on signature failure

3. **`webhook_events` table**
   - Columns: `id (stripe event id)`, `type`, `payload jsonb`, `processed_at`, `created_at`
   - Every incoming event is persisted **before** processing
   - Idempotency: if an event ID already exists in this table, skip processing (return 200)

4. **Local webhook forwarding**
   - Document how to run `stripe listen --forward-to localhost:5173/api/webhooks/stripe`
   - Capture `STRIPE_WEBHOOK_SECRET` from the CLI output

5. **Stripe Customer creation**
   - When a user signs up (or at first checkout), create a Stripe Customer
   - Store `stripe_customer_id` on the user or organization row
   - Idempotency key = user UUID (prevents duplicate customers)

### Phase 8 acceptance criteria

- `pnpm stripe:listen` forwards events locally.
- A test event (`stripe trigger customer.created`) hits the webhook and is persisted to `webhook_events`.
- Invalid signatures return 400.
- Duplicate events are skipped (idempotency works).

---

## Phase 9 — Billing Services

**Goal:** The subscription lifecycle is fully implemented. Every Stripe event mutates the database correctly.

### What ships in this phase

1. **Subscription schema activation**
   - `subscriptions` — user's current subscription state (mirrored from Stripe)
   - `invoices` — mirror of Stripe invoices for in-app history
   - `payment_methods` — reference only (last 4, brand, exp — never PAN)

2. **Webhook handlers for each event type**

   ```
   customer.subscription.created      → insert into subscriptions
   customer.subscription.updated      → update subscriptions + entitlements
   customer.subscription.deleted      → mark subscription canceled
   customer.subscription.trial_will_end → send reminder email
   invoice.created                    → insert into invoices
   invoice.payment_succeeded          → mark paid + send receipt
   invoice.payment_failed             → mark past_due + trigger dunning
   payment_method.attached            → insert into payment_methods
   payment_method.detached            → delete from payment_methods
   checkout.session.completed         → trigger any post-purchase actions
   ```

3. **Subscription state machine**

   ```
   trialing ──▶ active ──▶ canceled
       │          │
       ▼          ▼
   past_due ──▶ unpaid ──▶ canceled
   ```

   Every state transition:
   - Originates from a Stripe webhook event
   - Runs inside a database transaction
   - Writes to `webhook_events` (idempotency)
   - Updates `subscriptions` + `entitlements` atomically
   - Emits an `audit_log` entry

4. **Proration handling**
   - Upgrade: immediate charge for the difference, prorated
   - Downgrade: credit issued, applied to next invoice
   - Handled via Stripe's `proration_behavior: 'create_prorations'`

### Phase 9 acceptance criteria

- Triggering `customer.subscription.created` in Stripe CLI creates a subscription row in the DB.
- Triggering `customer.subscription.deleted` marks it canceled.
- The database never diverges from Stripe for subscription state.
- Webhook retries (Stripe retries up to 3 days) are idempotent.

---

## Phase 10 — Stripe & Plan Seeding

**Goal:** Running a single command populates Stripe with every product and price from the database, ready for checkout.

### What ships in this phase

1. **Sync script**

   ```ts
   // drizzle/seed/stripe-sync.ts
   // 1. Load products from DB
   // 2. For each product:
   //    - If stripe_product_id is null, create via Stripe API, save ID back to DB
   //    - If it exists, update via stripe.products.update()
   // 3. Load prices from DB
   // 4. For each price:
   //    - If stripe_price_id is null, create via Stripe API, save ID back
   //    - (Stripe prices are immutable — to "update" you create a new price and archive the old one)
   // 5. Archive any orphaned Stripe prices (exist in Stripe but not DB)
   ```

2. **Package.json scripts**
   ```json
   {
     "stripe:sync":   "tsx drizzle/seed/stripe-sync.ts",
     "stripe:listen": "stripe listen --forward-to localhost:5173/api/webhooks/stripe"
   }
   ```

3. **Seeded test customers (dev only)**
   - Create Stripe test customers for each persona
   - Attach a test payment method (Stripe's `tok_visa`)
   - Create active / trialing / past_due subscriptions for testing each state

4. **Testing runbook**
   - `docs/runbooks/stripe-testing.md`
   - Test card numbers reference (4242 for success, 4000 0025 0000 3155 for 3DS, etc.)
   - How to simulate each subscription state
   - How to replay webhook events

### Phase 10 acceptance criteria

- `pnpm stripe:sync` creates all products and prices in Stripe.
- The pricing page loads and displays the correct prices from the DB.
- `stripe_product_id` and `stripe_price_id` are populated in the DB.

---

## Phase 11 — Pricing Page & Checkout

**Goal:** Users can sign up for paid plans. The pricing page is rendered from the database. Checkout completes successfully.

### What ships in this phase

1. **Pricing page (`/pricing`)**
   - Renders from `products` + `prices` tables (dynamic)
   - Monthly / annual toggle with savings callout
   - Tier comparison table
   - "Contact sales" for custom / enterprise tiers (if applicable)

2. **Checkout session endpoint**

   ```ts
   // src/routes/api/checkout/+server.ts
   // 1. Require auth
   // 2. Validate requested price_id is one you offer
   // 3. Create / reuse Stripe Customer
   // 4. Create Stripe Checkout Session with:
   //    - price: the requested price_id
   //    - mode: 'subscription'
   //    - success_url, cancel_url
   //    - subscription_data.trial_period_days (if offering a trial)
   //    - metadata: { user_id, organization_id }
   // 5. Return session URL
   // 6. Client redirects to Stripe Checkout
   ```

3. **Post-checkout reconciliation**
   - `/checkout/success` page reads `session_id` from query
   - Verifies session status via Stripe API
   - Invalidates the user's entitlement cache
   - Shows a "Welcome to Pro" confirmation

4. **Trial grant on signup**
   - If offering a free trial, grant it at signup (not at checkout)
   - Insert entitlements row with `trial_ends_at = now() + interval '30 days'`
   - No card required for trial

5. **Webhook reconciliation**
   - `checkout.session.completed` is the authoritative success signal
   - Don't rely on the success_url redirect alone — users can close the tab

### Phase 11 acceptance criteria

- Clicking "Upgrade to Pro" with a test card completes checkout.
- The `subscriptions` row appears before the user lands back in the app.
- Entitlements update immediately (user sees Pro features).
- Trial-to-paid conversion works without requiring a new signup.

---

## Phase 12 — Customer Portal

**Goal:** Users can manage their subscription, payment methods, and invoice history without contacting support.

### What ships in this phase

1. **Stripe-hosted Customer Portal integration**
   - Endpoint: `/api/billing/portal`
   - Creates a Stripe Portal Session for the current user
   - Redirects to the portal URL
   - Portal configuration (what users can change) set in Stripe dashboard → Settings → Billing → Customer portal

2. **In-app billing summary (`/account/billing`)**
   - Current plan + renewal date
   - Payment method (last 4, brand, exp)
   - Next invoice preview
   - Invoice history with download links
   - Upgrade / downgrade / cancel buttons
   - Link to full Stripe portal

3. **Cancel flow with retention prompt**
   - Before confirming cancellation, show a retention offer (discount, pause, testimonials)
   - Track cancellation reason (optional survey)
   - On confirm, call Stripe to set `cancel_at_period_end: true`
   - User retains access until period end

4. **Plan change flow**
   - Upgrade: immediate proration, instant feature access
   - Downgrade: change takes effect at period end (default) or immediately with proration
   - Communicate clearly which mode is in effect

### Phase 12 acceptance criteria

- A user can change their plan without leaving the app (Stripe portal opens in a new tab or via redirect).
- Invoice history loads under 500ms.
- Cancellation at period end continues to provide access until renewal date.

---

## Phase 13 — Tier-Based Access Control

**Goal:** Every feature gate is enforced server-side. Free users cannot access Pro features. Pro users cannot exceed their quotas.

### What ships in this phase

1. **Entitlements table (populated)**

   ```sql
   entitlements (
     user_id uuid references users,
     organization_id uuid references organizations,
     feature text,              -- 'ai_queries', 'max_nodes', 'can_publish'
     value jsonb,               -- { limit: 100 } or { enabled: true }
     source text,               -- 'trial', 'pro_plan', 'studio_plan'
     expires_at timestamptz
   )
   ```

2. **Entitlement resolution (per request)**

   ```ts
   // Derived once per request, cached in locals
   export async function getEntitlements(userId: string): Promise<Entitlements> {
     // 1. Load user's active subscription
     // 2. Load explicit entitlements (overrides)
     // 3. Merge: subscription tier defaults + overrides
     // 4. Return typed entitlement object
   }
   ```

3. **Enforcement at every gated operation**

   ```ts
   // Before allowing a new node
   if (entitlements.current_node_count >= entitlements.max_nodes) {
     throw error(402, 'Upgrade to Pro for unlimited nodes');
   }

   // Before allowing AI query
   if (entitlements.ai_queries_this_month >= entitlements.ai_quota) {
     throw error(402, 'AI quota exceeded — upgrade or wait until next month');
   }
   ```

4. **UI-level entitlement awareness**
   - Gated buttons show a lock icon + "Upgrade to unlock" tooltip
   - Quota bars show usage (e.g., "87 / 100 nodes used")
   - Upgrade prompts appear at the moment of friction (not on page load)

5. **Counter updates**
   - On every gated write, increment the counter atomically (database trigger or in-app with row lock)
   - Reset monthly counters via a scheduled job (cron, Inngest, pg_cron)

### Phase 13 acceptance criteria

- A free user cannot create a 101st node (server rejects with 402).
- A Pro user cannot exceed 100 AI queries per month.
- Upgrading from Free to Pro immediately lifts the quota without a page reload.
- Downgrading at period end retains full access until the period ends.

---

## Phase 14 — Testing & CI/CD Hardening

**Goal:** You can ship on a Friday without fear. Every critical flow has a test. Every PR runs the full test suite.

### What ships in this phase

1. **Unit test coverage**
   - Vitest for all `src/lib/` code
   - Target: 90%+ line coverage for library code
   - Mock external services (Stripe, Resend, Anthropic)

2. **Integration test coverage**
   - Every API endpoint has integration tests
   - Test the auth flow end-to-end
   - Test permission enforcement (viewer can't write, admin can, etc.)
   - Test webhook handlers with recorded Stripe payloads

3. **E2E test coverage (Playwright)**
   - Sign up → verify email → create first node
   - Upgrade to Pro → checkout with test card → verify entitlement lift
   - Downgrade → verify access retained until period end
   - Cancel → verify subscription canceled
   - Run against preview deploy + production-shape seed data

4. **CI pipeline (GitHub Actions)**

   ```yaml
   on: [pull_request, push]
   jobs:
     test:
       steps:
         - checkout
         - setup-node (v22)
         - setup-pnpm (v10)
         - pnpm install --frozen-lockfile
         - pnpm lint
         - pnpm check     # TypeScript strict
         - pnpm test
         - pnpm build
         - pnpm test:e2e  # on main only or on label
   ```

5. **Preview deployments**
   - Every PR deploys to a preview URL (Vercel does this automatically)
   - Each preview has its own Neon database branch (copy-on-write)
   - Seeded on creation, destroyed on PR close

6. **Observability wired in**
   - Sentry for errors (server + client)
   - OpenTelemetry for traces
   - Structured logs (Pino or equivalent)
   - Alerts configured for error rate spikes, webhook failures, checkout drop-offs

7. **Runbooks complete**
   - `docs/runbooks/deploy-production.md`
   - `docs/runbooks/rollback.md`
   - `docs/runbooks/incident-response.md`
   - `docs/runbooks/stripe-webhook-replay.md`
   - `docs/runbooks/database-migration.md`

8. **Release to v1.0.0**
   - All phases complete
   - Test coverage targets met
   - Runbooks reviewed
   - Production environment provisioned (Neon prod, Stripe live, Resend verified)
   - Tag `v1.0.0`, cut GitHub Release, deploy to production
   - **Ship it.**

### Phase 14 acceptance criteria

- `pnpm test && pnpm test:e2e && pnpm build` passes cleanly.
- CI is green on `main`.
- A fresh production deploy succeeds and serves traffic.
- Sentry reports zero unexpected errors in the first 24 hours.

---

## Release Cadence

Every phase completion = version bump + changelog entry + tag + GitHub Release.

| Phase | Version | Milestone |
|---|---|---|
| 0     | v0.1.0  | Foundation |
| 1     | v0.2.0  | Database Schema |
| 2     | v0.3.0  | Database Seeding |
| 3     | v0.4.0  | Authentication |
| 4     | v0.5.0  | RBAC & Permissions |
| 5     | v0.6.0  | Validation & Security |
| 6     | v0.7.0  | Core CRUD |
| 7     | v0.8.0  | Email Service |
| 8     | v0.9.0  | Stripe Foundation |
| 9     | v0.10.0 | Billing Services |
| 10    | v0.11.0 | Stripe & Plan Seeding |
| 11    | v0.12.0 | Pricing Page & Checkout |
| 12    | v0.13.0 | Customer Portal |
| 13    | v0.14.0 | Tier Access Control |
| 14    | v1.0.0  | **Public Launch** |

Post-launch phases (desktop app, AI co-pilot, graph views, publishing, team collaboration, SSO) ship as minor or major version bumps per the roadmap.

---

## The Non-Negotiables

Summary of everything that cannot be skipped, negotiated, or deferred:

### Process

- **Conventional Commits** — every commit follows `type(scope): subject` with phase footer
- **Branch strategy** — feature branches → develop → main, PR-only merges to main
- **Pre-commit hooks** — lint, type check, secret scan, commit message validation
- **ADR for every significant decision** — immutable once accepted, superseded by new ADRs
- **Runbook for every operational task** — deploy, rollback, migration, webhook replay
- **Conventional Commits** footers: `Phase: N` + `Refs: PE7-<AREA>`

### Architecture

- **Database first, UI last** — never build UI before the server contract exists
- **Server-authoritative writes** — no client-side-only mutations
- **Dynamic pricing from DB** — Stripe is a processor, not a pricing source
- **RBAC on three layers** — route guard + server check + UI gating
- **Idempotency everywhere** — webhook IDs, API client retries, state transitions
- **Zero-downtime migrations** — every migration forward-compatible for one version

### Code

- **TypeScript strict mode** — `strict: true`, `noUncheckedIndexedAccess: true`
- **No `any` type** — use `unknown` and narrow
- **No `@ts-ignore`** — use `@ts-expect-error` with justification comment, or fix
- **No `console.log`** in committed code — use the logger
- **No hardcoded prices** — load from database
- **No hardcoded roles** — load from database
- **No skipping phases**

### Security

- **No secrets in code** — all via env vars, documented in `.env.example`
- **Rate limiting on auth endpoints** — sign-in, sign-up, password reset
- **CSP headers** set strictly
- **Input validation** at every boundary
- **Argon2id** for password hashing (never MD5/SHA1/weak bcrypt)
- **TLS-only** database connections
- **Webhook signature verification** before any side effect

### Testing

- **90%+ unit coverage** for library code
- **E2E for every critical flow** — signup, upgrade, downgrade, cancel
- **Integration test for every API endpoint** — auth + validation + permission
- **CI green before merge** — no exceptions

---

## Final Word

This sequence is not optional. It's not a guideline. It's not a "when I have time" list. It's the build order that distinguishes engineers who ship software that survives from engineers who ship software that gets rewritten in 18 months.

Build it right from commit one. Schema first. Seeds second. Auth third. Ship on Friday without fear.

---

<sub>This document is living. Every iteration of your product hardens what's here. When you learn something new about building SaaS at scale, append it.</sub>
