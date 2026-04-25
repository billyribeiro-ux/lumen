# Lumen Roadmap

> **Last updated:** 2026-04-24
> **Current version:** `v0.7.0`
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

### 🚧 v0.8.0 — Email Service
**Target:** Q3 2026
**Phase:** 7 (Email Service)
**Focus:** Resend SDK, Svelte-rendered email templates, transactional flows (welcome, verify, magic link, password reset, team invite, weekly digest), preferences, unsubscribe handling.

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
| v0.8.0   | 7     | Email Service (Resend)             | 🚧 In Progress | Q3 2026 |
| v0.9.0   | 8     | Stripe Foundation                  | 📅 Planned | Q3 2026    |
| v0.10.0  | 9     | Billing Services                   | 📅 Planned | Q4 2026    |
| v0.11.0  | 10    | Stripe & Plan Seeding              | 📅 Planned | Q4 2026    |
| v0.12.0  | 11    | Pricing Page & Checkout            | 📅 Planned | Q4 2026    |
| v0.13.0  | 12    | Customer Portal                    | 📅 Planned | Q4 2026    |
| v0.14.0  | 13    | Tier-Based Access Control          | 📅 Planned | Q4 2026    |
| v0.15.0  | 14    | Testing & CI/CD Hardening          | 📅 Planned | Q1 2027    |
| v1.0.0   | —     | **Public Launch (Web)**            | 📅 Planned | Q1 2027    |
| v1.1.0   | 15    | Tauri 2 Desktop App                | 📅 Planned | Q1 2027    |
| v1.2.0   | 16    | AI Co-Pilot (Claude API)           | 📅 Planned | Q2 2027    |
| v1.3.0   | 17    | Graph View (Motion GPU / WebGPU)   | 📅 Planned | Q2 2027    |
| v1.4.0   | 18    | Public Publishing & Subdomains     | 📅 Planned | Q2 2027    |
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

### 📅 Phase 7 — Email Service (`v0.8.0`)

Transactional email via Resend.

- Resend SDK integration
- Email template system (Svelte-rendered)
- Welcome email, verification, password reset, magic link
- Team invite emails
- Weekly digest email
- Email preferences in account settings
- Unsubscribe tokens + handling

---

### 📅 Phase 8 — Stripe Foundation (`v0.9.0`)

Dynamic pricing from the database.

- `products`, `prices` tables (source of truth)
- Stripe SDK setup (lazy client)
- Stripe product / price sync script (`pnpm stripe:sync`)
- Webhook handler skeleton with signature verification

---

### 📅 Phase 9 — Billing Services (`v0.10.0`)

Subscription lifecycle management.

- `subscriptions`, `invoices`, `payment_methods` tables
- Webhook handlers: `customer.subscription.*`, `invoice.*`, `payment_method.*`
- Idempotency keys for all webhook events
- Subscription state machine
- Proration handling on upgrade / downgrade

---

### 📅 Phase 10 — Stripe & Plan Seeding (`v0.11.0`)

Development-ready billing environment.

- Seed script that provisions Stripe products + prices from DB
- Seed test customers with active / trialing / canceled subscriptions
- `pnpm stripe:listen` wrapper for local webhook forwarding
- Test card number reference in `docs/runbooks/stripe-testing.md`

---

### 📅 Phase 11 — Pricing Page & Checkout (`v0.12.0`)

Marketing-grade pricing page + checkout flow.

- `/pricing` page (dynamic, rendered from DB)
- Monthly / annual toggle with savings callout
- Checkout session creation endpoint
- Post-checkout redirect with state reconciliation
- Trial grant on signup (30 days, no card)

---

### 📅 Phase 12 — Customer Portal (`v0.13.0`)

Self-serve billing management.

- Stripe-hosted customer portal integration
- In-app billing summary (`/account/billing`)
- Invoice history with download
- Payment method management
- Plan change flow (upgrade / downgrade)
- Cancel flow with retention prompt

---

### 📅 Phase 13 — Tier-Based Access Control (`v0.14.0`)

Enforce feature gates by tier.

- `entitlements` table (per-user, per-feature)
- Entitlement cache (per-request)
- Tier limits: node count, AI quota, seat count, publish count
- UI gating via entitlement-aware components
- Upgrade prompts at the point of friction

---

### 📅 Phase 14 — Testing & CI/CD (`v0.15.0`)

Production-hardening before launch.

- Vitest unit + integration suite (90%+ lib coverage)
- Playwright E2E for all critical flows
- GitHub Actions CI (lint, type check, test, build)
- Preview deployments on every PR (Vercel)
- Sentry + OpenTelemetry instrumentation
- Staging environment parity with production
- Load testing for Stripe webhook endpoint

---

### 📅 v1.0.0 — Public Launch (Web)

Lumen web is publicly available. Free tier live, Pro tier live.

---

### 📅 Phase 15 — Tauri 2 Desktop App (`v1.1.0`)

Native desktop experience.

- Tauri 2 wrapper around SvelteKit app
- Global hotkey (`⌥Space`) for quick capture
- System tray menu
- Offline-first sync (SQLite local, syncs to Neon)
- Menu bar app mode
- Native notifications
- Auto-updates via Tauri updater plugin
- Deep links (`lumen://`)
- macOS (ARM + Intel), Windows, Linux builds

---

### 📅 Phase 16 — AI Co-Pilot (`v1.2.0`)

Claude-powered assistant grounded in your graph.

- Anthropic API integration
- RAG over user's own nodes (private, per-user vector store)
- Chat panel (`⌘J`)
- Conversation history
- Quota enforcement per tier

---

### 📅 Phase 17 — Graph View (`v1.3.0`)

WebGPU-rendered knowledge graph.

- Motion GPU + WGSL fragment shaders
- Force-directed layout
- Filter by type, tag, project, time range
- Hover preview, click to open
- Cluster detection and highlighting

---

### 📅 Phase 18 — Public Publishing (`v1.4.0`)

Share any node as a public page.

- One-keystroke publish (`⌘⇧P`)
- Custom subdomain support (`billy.lumen.so`)
- SEO-optimized rendering
- Analytics (privacy-respecting, self-hosted)
- Comment threads (opt-in)

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
