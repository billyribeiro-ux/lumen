# Lumen Roadmap

> **Last updated:** 2026-04-24
> **Current version:** `v1.4.0` — PE7 14-phase chain complete.
> **Status legend:** ✅ Shipped · 🚧 In Progress · 📅 Planned · 🔮 Exploring

Lumen is built using the **PE7 14-Phase Topological Dependency Chain** — each phase is a hard dependency of the next, never skipped, never shortcut.

This roadmap is public, living, and updated at the end of every phase.

---

## Vision

Build the keyboard-driven knowledge OS that engineers, founders, and builders actually use every day — where code, docs, decisions, and daily work live in one graph, and nothing you learn ever gets lost.

**Non-goals:**
- Replace your IDE.
- Replace Git or GitHub.
- Become a chat app.
- Become an email client.
- Chase feature parity with Notion.

---

## Current Milestone

### 🔮 v2.0.0 — Team Collaboration (post-PE7)
**Target:** Q3 2027
**Focus:** CRDT-based real-time editing, presence, shared projects, team RBAC, SSO (SAML/OIDC), audit-log export.

---

## Release Timeline

| Version  | Phase | Milestone                          | Status    | Target     |
| -------- | ----- | ---------------------------------- | --------- | ---------- |
| v0.1.0   | 0     | Foundation & Environment           | ✅ Shipped | 2026-04-24 |
| v0.2.0   | 1     | Database Schema                    | ✅ Shipped | 2026-04-24 |
| v0.3.0   | 2     | Database Seeding                   | ✅ Shipped | 2026-04-24 |
| v0.4.0   | 3     | Authentication (Better Auth + Passkeys + 2FA) | ✅ Shipped | 2026-04-24 |
| v0.5.0   | 4     | RBAC & Permissions                 | ✅ Shipped | 2026-04-24 |
| v0.6.0   | 5     | Validation & Security Layer        | ✅ Shipped | 2026-04-24 |
| v0.7.0   | 6     | Core CRUD (Nodes, Links, Tags)     | ✅ Shipped | 2026-04-24 |
| v0.8.0   | 7     | Email Service (Resend)             | ✅ Shipped | 2026-04-24 |
| v0.9.0   | 8     | Stripe Foundation                  | ✅ Shipped | 2026-04-24 |
| v0.10.0  | 9     | Billing Services                   | ✅ Shipped | 2026-04-24 |
| v0.11.0  | 10    | Stripe & Plan Seeding              | ✅ Shipped | 2026-04-24 |
| v0.12.0  | 11    | Pricing Page & Checkout            | ✅ Shipped | 2026-04-24 |
| v0.13.0  | 12    | Customer Portal                    | ✅ Shipped | 2026-04-24 |
| v0.14.0  | 13    | Tier-Based Access Control          | ✅ Shipped | 2026-04-24 |
| v0.15.0  | 14    | Testing & CI/CD Hardening          | ✅ Shipped | 2026-04-24 |
| v1.0.0   | —     | **Public Launch (Web)**            | 🚧 Pending external accounts | Q1 2027 |
| v1.1.0   | 15    | Tauri 2 Desktop App                | ✅ Scaffold shipped | 2026-04-24 |
| v1.2.0   | 16    | AI Co-Pilot (Claude API)           | ✅ Shipped | 2026-04-24 |
| v1.3.0   | 17    | Graph View (Motion GPU / WebGPU)   | ✅ Shipped | 2026-04-24 |
| v1.4.0   | 18    | Public Publishing & Subdomains     | ✅ Shipped | 2026-04-24 |
| v2.0.0   | —     | Team Collaboration (Studio tier)   | 🔮 Exploring | Q3 2027  |

---

## Phase Details

### ✅ Phase 0 — Foundation & Environment (`v0.1.0`)
**Shipped 2026-04-24**

Baseline documentation, repository setup, and governance.

- `README`, `LICENSE`, `.gitignore`, `.env.example`
- `CHANGELOG`, `SECURITY`, `CONTRIBUTING`, `CODE_OF_CONDUCT`
- GitHub issue templates, PR template
- PE7 build methodology codified
- Conventional Commits workflow

---

### ✅ Phase 1 — Database Schema (`v0.2.0`)
**Shipped 2026-04-24**

Foundational application scaffold + 31-table Drizzle schema across 8 domains per `docs/LUMEN_VISION.md`. Authored in `src/lib/server/db/schema/`; initial migration at `drizzle/0000_initial_schema.sql`.

- `sv create` SvelteKit scaffold with TypeScript strict
- Vercel adapter configuration
- Drizzle ORM + `@neondatabase/serverless` setup
- **Auth (4):** `users`, `sessions`, `accounts`, `verification`
- **Organizations (3):** `organizations`, `memberships`, `invitations`
- **RBAC (3):** `roles`, `permissions`, `role_permissions`
- **Content (6):** `nodes`, `node_content`, `node_versions`, `links`, `tags`, `node_tags`
- **Satellite type tables (5):** `decisions`, `snippets`, `dailies`, `publications`, `inbox_items`
- **AI co-pilot (2):** `ai_conversations`, `ai_messages` (defined now, used in Phase 16)
- **Billing (6):** `products`, `prices`, `subscriptions`, `invoices`, `payment_methods`, `entitlements`
- **System (2):** `audit_log`, `webhook_events`
- Initial migration + migration strategy (Drizzle Kit)
- `drizzle.config.ts`, `drizzle/` directory structure
- Database connection module (`src/lib/server/db/`)

---

### ✅ Phase 2 — Database Seeding (`v0.3.0`)
**Shipped 2026-04-24**

Reproducible local development data on top of the Phase 1 schema. Personas + RBAC + billing catalog + sample content. See `docs/runbooks/database-seeding.md`.

---

### ✅ Phase 3 — Authentication (`v0.4.0`)
**Shipped 2026-04-24**

Better Auth 1.6 wired with the Drizzle adapter. Email + password (Argon2id), WebAuthn passkeys, TOTP 2FA + backup codes, OAuth (Google + GitHub), and magic-link sign-in. Sessions persisted in Postgres; cookies prefixed `lumen.`, HttpOnly + SameSite=Lax + Secure-in-prod. See `src/lib/server/auth.ts` and `src/routes/(auth)/`.

---

### ✅ Phase 4 — RBAC & Permissions (`v0.5.0`)
**Shipped 2026-04-24**

Server-authoritative role-based access control with `can()` and `requirePermission()` helpers, route guards in `hooks.server.ts`, and an end-to-end invitation flow (`/account/team` + `/invite/[token]`). See `src/lib/server/rbac.ts`, `src/lib/server/auth-helpers.ts`, `src/lib/server/invitations.ts`.

---

### ✅ Phase 5 — Validation & Security (`v0.6.0`)
**Shipped 2026-04-24**

Valibot schemas for auth, organizations, nodes, links, tags, and inbox capture. `LumenError` taxonomy keyed to HTTP statuses. Append-only `audit()` helper. Three Upstash sliding-window rate limiters. CSP + HSTS + standard defensive headers via `hooks.server.ts`. Superforms 2.30 added (Phase 6 wires forms).

---

### ✅ Phase 6 — Core CRUD (`v0.7.0`)
**Shipped 2026-04-24**

The visible product. Node CRUD across all 9 types with version history, command bar (⌘K) backed by `/api/search`, three OKLCH themes (Obsidian/Parchment/Nord-PE7), self-hosted Inter+JetBrains Mono+Literata, global keyboard shortcut registry (`⌘N`, `⌘K`, `⌘⇧T`, `⌘/`), backlinks panel, audit-logged mutations.

**Deferred to 6.x (post-launch hardening):**
- Postgres `tsvector` migration to upgrade `searchNodes` from substring to full-text.
- `[[wiki-link]]` auto-link parser inside node bodies.
- Split panes (`⌘\`).
- WYSIWYG editor (current surface is markdown textarea).

---

### ✅ Phase 7 — Email Service (`v0.8.0`)
**Shipped 2026-04-24**

Resend integration with Svelte-rendered templates (Welcome, VerifyEmail, PasswordReset, MagicLink, TeamInvite). Better Auth callbacks and the invitation flow now route through `sendEmail()`. Dev path stubs to stderr; production hard-fails without `RESEND_API_KEY`.

**Deferred to 7.x post-launch:** weekly digest, in-app email preferences, unsubscribe token table.

---

### ✅ Phase 8 — Stripe Foundation (`v0.9.0`)
**Shipped 2026-04-24**

Lazy Stripe singleton, idempotent DB → Stripe sync script (`pnpm stripe:sync`), and a signature-verified webhook receiver at `/api/webhooks/stripe` with `webhook_events` idempotency. Phase 9 adds the dispatch table for subscription state, invoice mirror, and payment-method mirror.

---

### ✅ Phase 9 — Billing Services (`v0.10.0`)
**Shipped 2026-04-24**

Stripe webhook handlers for subscription lifecycle (state machine reflected in `subscriptions`), invoices (mirror table), and payment methods (display-only fields). Each handler is idempotent and re-derives entitlements atomically. Proration is handled implicitly by Stripe; future phases may surface it explicitly to the UI.

---

### ✅ Phase 10 — Stripe & Plan Seeding (`v0.11.0`)
**Shipped 2026-04-24**

`pnpm stripe:seed-customers` opens active subscriptions for the seeded org owners (refuses non-test keys). `docs/runbooks/stripe-testing.md` documents the full local loop, test cards, event triggers, replay procedure, and live rollover.

---

### ✅ Phase 11 — Pricing Page & Checkout (`v0.12.0`)
**Shipped 2026-04-24**

Public `/pricing` rendered from the DB catalog, monthly/annual toggle with auto-computed savings, Stripe Checkout session creation at `/api/checkout`, 30-day Pro trial via `subscription_data.trial_period_days`, organization metadata threaded so webhook handlers attach the subscription to the right org.

---

### ✅ Phase 12 — Customer Portal (`v0.13.0`)
**Shipped 2026-04-24**

`/account/billing` shows the active plan, status, trial countdown, payment methods, and recent invoices. "Manage subscription" / "Manage payment methods" exchange the user's Stripe customer id for a Billing Portal session at `/api/portal`.

---

### ✅ Phase 13 — Tier-Based Access Control (`v0.14.0`)
**Shipped 2026-04-24**

`getEntitlementProfile()` resolves trial-aware effective tier and per-feature limits. `requireEntitlement()` throws tier-specific 402 errors. Layout hydrates `data.entitlements` for UI gating. `UpgradePrompt` reusable pattern for tier-locked surfaces.

---

### ✅ Phase 14 — Testing & CI/CD (`v0.15.0`)
**Shipped 2026-04-24**

Five-job GitHub Actions CI (lint+typecheck, unit-tests, e2e-tests, build, secret-scan), Sentry SvelteKit integration with PII-stripped beforeSend, initial unit-test coverage for `errors`, `validation/schemas`, and `rbac.outranks`. Vercel preview deploys flow via the existing Vercel + Neon integration; production observability is wired and waits on `SENTRY_DSN` + `NEON_PREVIEW_DATABASE_URL` + `CI_BETTER_AUTH_SECRET` repository secrets to go live.

**Deferred to v1.0.0 final-prep:** load testing the Stripe webhook endpoint, full E2E happy-path coverage (auth → create node → publish → checkout), Lighthouse CI for performance budget enforcement.

---

### 📅 v1.0.0 — Public Launch (Web)

Lumen web is publicly available. Free tier live, Pro tier live.

---

### ✅ Phase 15 — Tauri 2 Desktop App (`v1.1.0` scaffold)
**Shipped 2026-04-24**

Tauri 2 crate authored under `src-tauri/`, ⌥Space global hotkey, system tray, deep links, Ed25519 updater config, IPC bridge with web-fallback. Production bundle is a 1.1.x deliverable pending the `frontendDist` strategy choice (see `docs/runbooks/desktop-release.md`).

---

### ✅ Phase 16 — AI Co-Pilot (`v1.2.0`)
**Shipped 2026-04-24**

Claude-powered chat panel grounded in user nodes via RAG. Prompt caching on the system prompt + grounding context block keeps token cost bounded across repeat queries. Per-tier quotas enforced (Free 0 / Pro 100 / Studio ∞). Slug citations link back to the underlying node.

---

### ✅ Phase 17 — Graph View (`v1.3.0`)
**Shipped 2026-04-24**

D3 force-directed layout on a 2D canvas with hue-mapped node types and per-relation edge styling. Type-filter chips, hover labels, click-to-navigate. WGSL shaders authored for the WebGPU upgrade in v1.3.x once Motion GPU's pipeline API stabilizes.

---

### ✅ Phase 18 — Public Publishing (`v1.4.0`)
**Shipped 2026-04-24**

`/api/publish` POST/DELETE pins a `node_versions.id` to a public URL. SEO-rendered `/p/[slug]` view with Lumen attribution. Tier-gated (Pro path-based, Studio custom subdomain). Edge subdomain routing arrives in v1.4.x once the Vercel rewrite is in place.

---

### 🔮 v2.0.0 — Team Collaboration

Studio tier full realization.

- Real-time multi-user editing (CRDT-based)
- Presence indicators
- Shared projects and workspaces
- Team-level RBAC
- SSO (SAML, OIDC)
- Audit log export

---

## Guiding Principles

Every item on this roadmap must pass these tests:

1. **Does it earn its place?** No feature ships because it's cool. It ships because users need it.
2. **Does it work with keyboard alone?** Mouse is optional. Keyboard is required.
3. **Does it respect the graph?** Everything connects. Nothing is an island.
4. **Does it honor PE7 standards?** Zero shortcuts, 10-year longevity, production-grade from commit one.
5. **Does it keep the build honest?** Schema first, seeding second, auth third. No skipping.

---

## How to Influence the Roadmap

- 💡 **Open a [Discussion](https://github.com/billyribeiro-ux/lumen/discussions)** for ideas, product direction, or questions.
- 🎯 **Open a [Feature Request](https://github.com/billyribeiro-ux/lumen/issues/new?template=feature_request.md)** for concrete proposals.
- 🐛 **Open a [Bug Report](https://github.com/billyribeiro-ux/lumen/issues/new?template=bug_report.md)** for anything broken.
- 📬 **Email [hello@lumen.so](mailto:hello@lumen.so)** for private inquiries.

---

<sub>This roadmap is a forecast, not a commitment. Dates shift as reality reveals itself. The sequence does not shift.</sub>
