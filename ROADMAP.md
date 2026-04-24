# Lumen Roadmap

> **Last updated:** 2026-04-24
> **Current version:** `v0.1.0`
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

### 🚧 v0.2.0 — Database Schema Foundation
**Target:** Q2 2026
**Phase:** 1 (Schema Design)
**Focus:** Drizzle schema for Nodes, Links, Users, Projects, and auth scaffolding.

---

## Release Timeline

| Version  | Phase | Milestone                          | Status    | Target     |
| -------- | ----- | ---------------------------------- | --------- | ---------- |
| v0.1.0   | 0     | Foundation & Environment           | ✅ Shipped | 2026-04-24 |
| v0.2.0   | 1     | Database Schema                    | 🚧 In Progress | Q2 2026 |
| v0.3.0   | 2     | Database Seeding                   | 📅 Planned | Q2 2026    |
| v0.4.0   | 3     | Authentication (Better Auth + Passkeys + 2FA) | 📅 Planned | Q2 2026 |
| v0.5.0   | 4     | RBAC & Permissions                 | 📅 Planned | Q3 2026    |
| v0.6.0   | 5     | Validation & Security Layer        | 📅 Planned | Q3 2026    |
| v0.7.0   | 6     | Core CRUD (Nodes, Links, Tags)     | 📅 Planned | Q3 2026    |
| v0.8.0   | 7     | Email Service (Resend)             | 📅 Planned | Q3 2026    |
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

### 🚧 Phase 1 — Database Schema (`v0.2.0`)

Design and implement the foundational Drizzle schema.

- `sv create` SvelteKit scaffold with TypeScript strict
- Vercel adapter configuration
- Drizzle ORM + `@neondatabase/serverless` setup
- Core tables: `users`, `sessions`, `accounts`, `organizations`, `projects`, `nodes`, `node_types`, `node_content`, `node_versions`, `links`, `tags`, `node_tags`
- Initial migration + migration strategy (Drizzle Kit)
- `drizzle.config.ts`, `drizzle/` directory structure
- Database connection module (`src/lib/server/db/`)

---

### 📅 Phase 2 — Database Seeding (`v0.3.0`)

Reproducible local development data.

- `drizzle/seed.ts` entry point
- Dev persona generator (15 credentialed test users across tiers + roles)
- Sample projects, nodes, links, tags, snippets
- Seed data for all node types (note, task, decision, spec, snippet, person, daily)
- `pnpm db:seed` and `pnpm db:reset` scripts
- Seed data isolation from production (env-guarded)

---

### 📅 Phase 3 — Authentication (`v0.4.0`)

Better Auth 1.6.x with passkeys, 2FA, and OAuth.

- Email + password auth
- Passkey (WebAuthn) registration and sign-in
- TOTP 2FA
- OAuth: Google, GitHub
- Magic link sign-in
- Session middleware in `hooks.server.ts`
- Email verification flow
- Password reset flow
- Account settings UI (`/account/security`)
- Sign-in, sign-up, forgot password, verify email routes

---

### 📅 Phase 4 — RBAC & Permissions (`v0.5.0`)

Fine-grained role-based access control.

- Roles: `owner`, `admin`, `editor`, `viewer`
- Per-project and per-organization scope
- `roles`, `permissions`, `role_permissions`, `memberships` tables
- Permission check helpers (`can(user, action, resource)`)
- Route-level guards in `hooks.server.ts`
- UI-level gating via derived permissions
- Invite flow for teammates (Studio tier)

---

### 📅 Phase 5 — Validation & Security (`v0.6.0`)

Server-side validation everywhere.

- Valibot schemas for every mutation
- `sveltekit-superforms` integration with Valibot adapter
- Centralized error types and error boundary pattern
- CSRF protection (SvelteKit built-in)
- Rate limiting (Upstash Redis)
- Input sanitization for user-generated content (HTML, Markdown)
- Audit log table and write helper

---

### 📅 Phase 6 — Core CRUD (`v0.7.0`)

The core Lumen experience.

- Node CRUD (all types: note, task, decision, spec, snippet, link, person, daily)
- Bidirectional link creation (`[[wiki-style]]`)
- Typed relations (`blocks`, `related`, `supersedes`, `derives_from`)
- Tag CRUD + tag autocomplete
- Full-text search (Postgres `tsvector`)
- Node versioning on every edit
- Command bar (`⌘K`) with fuzzy search
- Split panes (`⌘\`)
- Keyboard shortcut system

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
