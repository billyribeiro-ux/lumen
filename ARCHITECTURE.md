# Lumen Architecture

> **Document version:** 1.0
> **Last updated:** 2026-04-24
> **Maintainer:** [@billyribeiro-ux](https://github.com/billyribeiro-ux)
> **Status:** Living document — updated at the end of every phase

This document describes the architecture of **Lumen**: the rationale behind every major decision, the shape of the system, how data flows, and the principles that govern every change. If you are reading this before writing code, you are doing it right.

---

## Table of Contents

- [1. System Overview](#1-system-overview)
- [2. Architectural Principles](#2-architectural-principles)
- [3. Technology Stack](#3-technology-stack)
- [4. The Core Data Model](#4-the-core-data-model)
- [5. Request Lifecycle](#5-request-lifecycle)
- [6. Authentication & Authorization](#6-authentication--authorization)
- [7. Billing Architecture](#7-billing-architecture)
- [8. Frontend Architecture](#8-frontend-architecture)
- [9. Desktop Architecture (Tauri 2)](#9-desktop-architecture-tauri-2)
- [10. Observability](#10-observability)
- [11. Deployment Topology](#11-deployment-topology)
- [12. Security Model](#12-security-model)
- [13. Performance Budget](#13-performance-budget)
- [14. Scalability Strategy](#14-scalability-strategy)
- [15. Decision Records](#15-decision-records)

---

## 1. System Overview

Lumen is a keyboard-driven knowledge operating system. At its heart, it is a **typed bidirectional graph** of user-owned content (Nodes), accessible through a SvelteKit web app and a Tauri 2 desktop app, backed by Neon Postgres.

### High-Level Diagram

\`\`\`
┌─────────────────────────────────────────────────────────────────────┐
│                            CLIENTS                                   │
│                                                                       │
│   ┌──────────────────┐      ┌────────────────────────────────┐       │
│   │  Web Browser     │      │  Tauri 2 Desktop App           │       │
│   │  (SvelteKit SSR) │      │  (Same SvelteKit build + Rust) │       │
│   └────────┬─────────┘      └───────────────┬────────────────┘       │
│            │                                 │                        │
└────────────┼─────────────────────────────────┼────────────────────────┘
             │ HTTPS                           │ HTTPS + local SQLite
             ▼                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     EDGE / APP SERVER (Vercel)                       │
│                                                                       │
│   SvelteKit hooks.server.ts ──▶ Auth Middleware ──▶ Route Handlers   │
│                                      │                               │
│                                      ▼                               │
│                              Better Auth 1.6                         │
│                              Remote Functions                        │
│                              Form Actions                            │
│                              Webhook Handlers (Stripe, Resend)       │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ pooled connection
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    NEON POSTGRES (primary data store)                │
│                                                                       │
│  users · sessions · organizations · projects · nodes · node_versions │
│  links · tags · snippets · decisions · dailies · inbox_items         │
│  publications · subscriptions · entitlements · audit_log             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICES                             │
│                                                                       │
│   Stripe (billing)    Resend (email)    Anthropic (AI co-pilot)     │
│   Sentry (errors)     Upstash (cache)   GitHub (source / CI)        │
└─────────────────────────────────────────────────────────────────────┘
\`\`\`

### What Lumen Is

- A **personal knowledge graph** — nodes connect to other nodes via typed bidirectional links.
- **Server-authoritative** — the database is the source of truth. The client reflects it.
- **Keyboard-first** — every action has a shortcut. Mouse is optional.
- **Offline-capable on desktop** — the Tauri app works without a network, syncing when online.
- **Single-tenant data model** — every resource is scoped to an owning organization and user.

### What Lumen Is Not

- Not real-time collaborative at v1. CRDT-based multi-user editing is a v2 concern.
- Not a chat app. Conversations are for AI co-pilot only.
- Not an email client. Resend is for transactional only.
- Not an IDE. Snippets are referenced, not executed.

---

## 2. Architectural Principles

Every decision in this codebase must pass these tests. They are not guidelines — they are constraints.

### 2.1 Server-Authoritative

The database is the source of truth. The client reflects it. No client-side write queues, no optimistic-only UIs that can drift, no "sync later" patterns that invite data loss.

### 2.2 Bottom-Up Construction

Schema first, seeds second, auth third. UI never precedes its server contract. This is the PE7 topological build chain — and it's enforced by phase discipline, not documentation alone.

### 2.3 Dynamic Pricing from the Database

Stripe processes payments. Stripe does not define them. Products, prices, and entitlements live in Postgres and are mirrored to Stripe via seeding scripts. One source of truth; zero dashboard drift.

### 2.4 Type Safety Everywhere

TypeScript strict mode across the app. Drizzle types flow from schema to queries to components without manual duplication. Valibot validates every boundary: form input, API request, webhook payload.

### 2.5 Zero Client-Side Secrets

Only variables prefixed with \`PUBLIC_\` reach the browser. Everything else stays server-side. Secrets live in Vercel env vars (production) and \`.env\` (local). The repo contains only \`.env.example\`.

### 2.6 Conventional Everything

Conventional Commits. Conventional Issues. Conventional PRs. Conventional file naming. Predictability compounds; surprise is a tax.

### 2.7 10-Year Longevity

Pick libraries with stable teams, active maintenance, and clear governance. Prefer standard library over new dependencies. Every added dep is a permanent debt — added only with justification.

---

## 3. Technology Stack

Every choice justified. Every choice versioned. Every choice replaceable if it stops earning its place.

### 3.1 Core Framework Layer

| Component | Choice | Version | Rationale |
|---|---|---|---|
| Meta-framework | SvelteKit | 2.57.x | Server-authoritative by design, form actions + remote functions, best-in-class TypeScript ergonomics. |
| UI compiler | Svelte | 5.55.x | Runes reactivity model, snippets, attachments. Smaller runtime than React. |
| Language | TypeScript | 5.7+ strict | Non-negotiable. `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`. |
| Build | Vite | 8.x | Native SvelteKit integration. Rolldown migration path. |
| Runtime | Node.js | 22 LTS | Standard. Neon serverless driver requires ≥19. |
| Package manager | pnpm | 10.x | Deterministic installs, disk-efficient, monorepo-ready. Enforced; no npm/yarn/bun allowed. |

### 3.2 Data Layer

| Component | Choice | Rationale |
|---|---|---|
| Database | Neon Postgres (serverless) | Branching, auto-scaling, compute autosuspend, zero-ops Postgres. |
| ORM | Drizzle ORM | SQL-first, type-safe, zero runtime overhead, honest about what it does. |
| Driver | `@neondatabase/serverless` | HTTP + WebSocket, edge-compatible, pooling built in. |
| Migrations | drizzle-kit | Generated from schema; never hand-rolled. |
| Cache | Upstash Redis (REST) | Rate limiting, session extension, entitlement cache. Stateless HTTP — edge-compatible. |

### 3.3 Auth, Validation, Forms

| Component | Choice | Rationale |
|---|---|---|
| Authentication | Better Auth 1.6.x | Framework-agnostic, first-class Drizzle adapter, native passkey + 2FA + OAuth. Owns sessions. |
| Validation | Valibot 1.x | ~1KB vs Zod's ~14KB. Tree-shakable. Superforms supports it first-class. |
| Forms | sveltekit-superforms 2.30.x | Server + client validation unified. File uploads. Progressive enhancement. |

### 3.4 UI Layer

| Component | Choice | Rationale |
|---|---|---|
| Primitives | Bits UI 2.17.x | Headless, Svelte 5 native, WAI-ARIA compliant. Accessibility without styling lock-in. |
| Styling | PE7 CSS Architecture | OKLCH tokens, `@layer` cascade, logical properties, native nesting. Zero Tailwind. |
| Icons | Iconify (`@iconify/svelte`) | On-demand loading. Phosphor + Carbon icon sets only. |
| Animation | GSAP 3.x | Timeline-driven sequences, page transitions, FLIP. |
| GPU Effects | `@motion-core/motion-gpu` | WebGPU/WGSL shaders for focus mode + graph view. |
| Dev inspector | `sv-agentation` | Click-to-source + annotation for agentic workflows. Dev-only. |

### 3.5 Integrations

| Component | Choice | Rationale |
|---|---|---|
| Payments | Stripe | Industry standard. Tax, invoices, portal, webhooks — all solved. |
| Email | Resend | Svelte-native templates, great deliverability, simple API. |
| AI Co-Pilot | Anthropic Claude API | Opus 4.7 for reasoning-heavy tasks. Per-user quota enforced at tier level. |
| Error tracking | Sentry + OpenTelemetry | Native SvelteKit instrumentation adapter. |

### 3.6 Desktop

| Component | Choice | Rationale |
|---|---|---|
| Desktop wrapper | Tauri 2 | Rust-backed, smaller than Electron, native menus + tray + hotkeys. |
| Local database | SQLite via Tauri SQL plugin | Offline-first sync. Conflict resolution via versioned writes. |

### 3.7 Dev Tooling

| Component | Choice | Rationale |
|---|---|---|
| Lint + Format | Biome 2.x | One tool. 10x faster than ESLint + Prettier. |
| Git hooks | lefthook | Faster than Husky, simpler config. |
| Testing (unit) | Vitest 3.x + Browser Mode | Real browser, no JSDOM lies. |
| Testing (E2E) | Playwright 1.50+ | Cross-browser, network interception, trace viewer. |
| Commit linting | commitlint | Conventional Commits enforcement. |
| Secret detection | gitleaks | Runs in lefthook + CI. |
| MCP | `@sveltejs/mcp` (official) | Live Svelte 5 / SvelteKit 2 documentation context for AI agents. |

### 3.8 Deployment

| Component | Choice | Rationale |
|---|---|---|
| Host | Vercel | Native SvelteKit adapter, preview deployments per PR, edge functions, Fluid Compute. |
| Adapter | `@sveltejs/adapter-vercel` 5.x | First-party. |
| CI/CD | GitHub Actions | Free for public repos. Runs lint, check, test, build on every PR. |
| Secret storage | Vercel Environment Variables | Scoped per environment (dev, preview, production). |

---

## 4. The Core Data Model

Lumen's data model is a **single typed bidirectional graph**. Every substantive user-created entity is a `Node`. Relationships between Nodes are first-class: typed, directional, and queryable.

### 4.1 Nodes

A `Node` has:
- `id` (uuid, primary key)
- `organization_id` (foreign key, scopes ownership)
- `project_id` (foreign key, optional — Nodes can live outside projects)
- `author_id` (foreign key to users)
- `type` (enum: `note`, `task`, `decision`, `spec`, `snippet`, `link`, `person`, `project`, `daily`)
- `title` (text)
- `slug` (text, unique per organization)
- `status` (type-specific state machine)
- `metadata` (jsonb, type-specific fields)
- `created_at`, `updated_at`, `deleted_at` (soft delete)

### 4.2 Node Content

Content is stored **separately** from the node header (`node_content` table). This allows:
- Header-only queries (for lists, search, graph) without loading large markdown bodies.
- Independent versioning of content vs metadata.
- Future content-type expansion without header schema churn.

### 4.3 Node Versions

Every edit to `node_content` writes a new row in `node_versions` with a monotonically increasing `version` per node. The current version is pointed to by `node_content.current_version_id`. History is cheap and durable.

### 4.4 Links

`links` is the edge table. Each row:
- `id` (uuid)
- `source_node_id`, `target_node_id`
- `relation_type` (enum: `references`, `blocks`, `related`, `supersedes`, `derives_from`, `embeds`)
- `created_at`

Bidirectional traversal is achieved via an index on `target_node_id`. Backlinks are not a separate table — they're a reverse query.

### 4.5 Tags

Tags are owned by the organization. `node_tags` is the junction table. Tag autocomplete and filtering use Postgres trigram indexes for fuzzy matching.

### 4.6 Type-Specific Tables

Some Node types have dedicated satellite tables when they need structure beyond `metadata`:
- `decisions` — context, options, decision, consequences, superseded_by
- `snippets` — language, filename, highlighted_html
- `dailies` — daily_date (unique per user per day)
- `publications` — public Node shares (subdomain, published_version_id, published_at)
- `inbox_items` — unprocessed captures (promoted to Nodes later)

### 4.7 Billing Tables

- `products` — tier definitions (`free`, `pro`, `studio`). Source of truth.
- `prices` — price points per product (monthly / annual). Source of truth.
- `subscriptions` — user's current subscription state, synced from Stripe webhooks.
- `invoices` — mirror of Stripe invoices for in-app history.
- `payment_methods` — reference only; actual PANs never touch our DB.
- `entitlements` — per-user feature flags derived from subscription state.

### 4.8 Organizational Tables

- `organizations` — top-level tenancy unit. Every resource rolls up to an org.
- `memberships` — user ↔ organization with role.
- `invitations` — pending membership invites (token-based).
- `roles` — `owner`, `admin`, `editor`, `viewer`.
- `permissions` — fine-grained actions (future-proofed; denormalized into roles for now).

### 4.9 AI Co-Pilot Tables

The Phase 16 AI co-pilot persists conversations grounded in the user's own graph:

- `ai_conversations` — one row per conversation thread. Scoped to `user_id` and `organization_id`. Carries title, model, tier-derived quota counters, and `last_message_at` for sidebar ordering.
- `ai_messages` — append-only message log keyed to `ai_conversations`. Stores role (`user` / `assistant` / `tool`), content, and a JSONB `grounding` array of `node_id` references used for retrieval-augmented generation.

These tables exist in the schema from Phase 1 even though the feature ships in Phase 16; defining them up front keeps RBAC and entitlement plumbing aware of the surface from day one.

### 4.10 Audit Log

`audit_log` captures every mutating action: who, what, when, before-state, after-state. Append-only, queryable by actor, resource, or time window. Essential for compliance, debugging, and trust.

### 4.11 Foreign Keys and Cascades

- `ON DELETE CASCADE` is used sparingly — only for leaf tables (e.g. `node_tags` when a tag is deleted).
- For all user-facing resources, **soft delete** is the default. `deleted_at` is set; the row persists.
- Hard delete is available as a separate admin operation with a 30-day grace window.

### 4.12 Indexes

Every foreign key has an index. Additional indexes:
- `nodes (organization_id, type, updated_at DESC)` — list views
- `links (source_node_id)`, `links (target_node_id)` — graph traversal
- `node_content` full-text tsvector index on the markdown body
- `tags (organization_id, name) UNIQUE` — tag dedup
- `sessions (expires_at)` — session cleanup
- `audit_log (organization_id, created_at DESC)` — activity feeds

---

## 5. Request Lifecycle

Every request follows a predictable path. No side trips, no hidden middleware, no magic.

### 5.1 Web Request Flow

\`\`\`
Browser
  │
  ▼ HTTPS
Vercel Edge (TLS termination, CDN, static asset serving)
  │
  ▼
SvelteKit Server Handler (Node runtime)
  │
  ├─▶ hooks.server.ts:handle
  │     ├─ Resolve session via Better Auth (cookie → session lookup)
  │     ├─ Hydrate event.locals.user / event.locals.session
  │     ├─ Apply rate limiting (Upstash)
  │     └─ Apply route-level auth guards
  │
  ├─▶ Route handler
  │     ├─ +page.server.ts (load)           ← read path
  │     ├─ +page.server.ts (actions)        ← write path (form)
  │     ├─ remote functions                 ← RPC-style reads / writes
  │     └─ +server.ts                       ← raw API endpoints / webhooks
  │
  ├─▶ Drizzle query layer (src/lib/server/db/)
  │     └─ Neon pooled connection over HTTP
  │
  ├─▶ Response built (PageData, ActionResult, or JSON)
  │
  └─▶ hooks.server.ts:handleError
        └─ Sentry capture + structured log emit
\`\`\`

### 5.2 Read Path (Load Functions)

Page routes use \`+page.server.ts load\` functions for initial data. They:
- Run on the server only.
- Return fully typed data to the component via \`PageData\`.
- Can be re-invoked via \`invalidate()\` without a full page reload.
- Never expose secrets — \`load\` output is serialized and sent to the browser.

### 5.3 Write Path (Form Actions + Remote Functions)

Two write primitives, chosen by context:

**Form Actions** — for form-driven mutations. Progressive enhancement: work without JS, enhanced with \`use:enhance\`. Superforms handles validation end-to-end.

**Remote Functions** — for programmatic mutations triggered by command bar, keyboard shortcuts, or dynamic UI. Typed RPC. Serialization handled by SvelteKit.

### 5.4 Webhook Path

External webhooks (Stripe, Resend) hit dedicated \`+server.ts\` endpoints at \`/api/webhooks/<provider>\`. They:
- Verify signatures before any side effect.
- Use idempotency keys keyed on provider event ID.
- Write to \`webhook_events\` for replay and audit.
- Return 2xx immediately; heavy work deferred to background where needed.

---

## 6. Authentication & Authorization

### 6.1 Authentication (Who are you?)

Better Auth owns this layer. Every request carries a session cookie (\`lumen.session_token\`). The session is verified server-side against Postgres on every request. No JWT, no stateless tokens — the DB decides who is authenticated.

**Supported factors:**
- Email + password (Argon2id hashing)
- Passkeys (WebAuthn)
- TOTP 2FA
- OAuth: Google, GitHub
- Magic link (email-delivered one-time link)

**Session policy:**
- Default lifetime: 30 days with sliding expiration.
- Invalidation on password change, 2FA change, or manual sign-out.
- All sessions revokable from \`/account/security\`.

### 6.2 Authorization (What can you do?)

RBAC scoped to two levels:

**Organization-level roles** — \`owner\`, \`admin\`, \`editor\`, \`viewer\`. Determine management capabilities (invite users, change billing, delete org).

**Project-level roles** — same role names, scoped to a single project. A user can be \`owner\` on one project and \`viewer\` on another within the same org.

**Entitlements** — orthogonal to RBAC. Entitlements come from the subscription tier (free / pro / studio) and gate *features*, not *permissions*. A free-tier user has the same RBAC as a pro-tier user; they just have fewer entitlements.

### 6.3 Authorization Enforcement

Three layers, always together:

1. **Route guard** in \`hooks.server.ts\` — redirects unauthenticated users off protected routes.
2. **Server-side permission check** at the handler — \`requirePermission(locals, 'node.update', nodeId)\`. Always runs before any DB mutation.
3. **UI-level gating** — disables or hides controls the user cannot use. *Cosmetic only.* The server check is authoritative.

Never trust the client. Ever.

---

## 7. Billing Architecture

### 7.1 The Dynamic Pricing Principle

**The database is the source of truth for pricing. Stripe is a processor.**

- \`products\` and \`prices\` live in Postgres.
- A seeding script (\`pnpm stripe:sync\`) creates or updates matching Stripe products / prices.
- The pricing page renders from Postgres. Stripe Checkout is invoked with DB-sourced \`price_id\`s.
- If you change a price, you change it in the DB, then run the sync. No dashboard clicking.

This pattern is standard at Vercel, Linear, and every serious SaaS. Dashboard-defined pricing is a liability.

### 7.2 Subscription State Machine

A subscription moves through these states, reflected in the \`subscriptions\` table and mirrored from Stripe via webhooks:

\`\`\`
trialing ──▶ active ──▶ canceled
    │          │           │
    │          ▼           │
    └─▶ past_due ──▶ unpaid
                        │
                        ▼
                    canceled
\`\`\`

Every state transition:
- Originates from a Stripe webhook event.
- Writes a row to \`webhook_events\` (idempotency).
- Updates \`subscriptions\` and \`entitlements\` atomically in the same transaction.
- Emits an \`audit_log\` entry.

### 7.3 Entitlements

Entitlements are derived from subscription state and cached per request:

\`\`\`ts
// Pseudo-code
const entitlements = {
  max_nodes: tier === 'free' ? 100 : Infinity,
  ai_queries_per_month: tier === 'pro' ? 100 : tier === 'studio' ? Infinity : 0,
  can_publish: tier !== 'free',
  can_use_desktop: tier !== 'free',
  max_seats: tier === 'studio' ? 5 : 1,
};
\`\`\`

Enforcement happens server-side before any gated operation. The UI reads entitlements via \`$page.data\` and gates controls accordingly.

### 7.4 Trials

Every new user gets a **30-day Pro trial, no card required**. The trial is granted on signup by inserting an \`entitlements\` row with \`trial_ends_at\`. When the trial ends, entitlements automatically downgrade to free. Users can upgrade at any time; upgrading ends the trial.

### 7.5 Webhook Idempotency

Every webhook event ID (e.g. \`evt_1P...\`) is persisted to \`webhook_events\`. If the same event arrives twice (retries, replays), the second arrival is a no-op. Stripe documents this pattern explicitly; Lumen implements it rigorously.

---

## 8. Frontend Architecture

### 8.1 State Model

Three layers of state:

**Server state** — owned by the DB, delivered via \`load\` and remote functions. Reactive via \`invalidate()\` or \`$page.data\`.

**URL state** — search queries, filters, selected pane, current route. Lives in \`$page.url\`. Shareable and bookmarkable.

**Ephemeral local state** — command bar open/closed, split pane sizes, focus mode active. Managed via Svelte 5 runes in \`.svelte.ts\` modules. Never persisted unless necessary.

### 8.2 Component Organization

\`\`\`
src/lib/components/
├── primitives/       # Thin wrappers over Bits UI — Button, Dialog, Popover
├── editor/           # Node editor, command menu, slash commands
├── command-bar/      # ⌘K surface and its result renderers
├── graph/            # Graph view, WebGPU canvas, force layout
├── layout/           # App shell, sidebars, panes, topbar
├── navigation/       # Breadcrumbs, node switcher, project switcher
├── billing/          # Pricing page, checkout, portal surfaces
└── patterns/         # Cross-cutting patterns — EmptyState, Skeleton, ErrorBoundary
\`\`\`

### 8.3 Keyboard Shortcut System

A single keyboard event dispatcher lives in \`src/lib/stores/shortcuts.svelte.ts\`:
- Registered commands are keyed by a canonical string (\`cmd.node.create\`).
- Each command has: id, description, default keybinding, scope, handler.
- Conflict detection at registration time.
- User overrides stored server-side via a \`user_preferences\` table (future phase).
- Visible in the command bar with the current keybinding rendered.

### 8.4 PE7 CSS Architecture

\`\`\`
@layer reset, tokens, theme, base, layout, components, utilities;

@layer tokens {
  :root {
    /* Tier-1 primitives — never read directly from components */
    --font-ui:       'Inter', system-ui, sans-serif;
    --font-mono:     'JetBrains Mono', ui-monospace, monospace;
    --font-reading:  'Literata', Georgia, serif;

    --text-base:     clamp(1rem, 0.94rem + 0.3vw, 1.125rem);
    --space-4:       clamp(1rem, 0.9rem + 0.5vw, 1.5rem);
  }
}

@layer theme {
  /* Theme: Obsidian — default OLED-friendly near-black, electric accent */
  [data-theme='obsidian'], :root {
    --color-background: oklch(0.12 0.01  260);
    --color-surface:    oklch(0.16 0.012 260);
    --color-text:       oklch(0.94 0.008 260);
    --color-accent:     oklch(0.72 0.20  260);
  }
  /* Theme: Parchment — warm off-white, amber accent */
  [data-theme='parchment'] {
    --color-background: oklch(0.96 0.018  85);
    --color-surface:    oklch(0.93 0.022  85);
    --color-text:       oklch(0.24 0.015  85);
    --color-accent:     oklch(0.62 0.14   65);
  }
  /* Theme: Nord-PE7 — cool blue-slate, signature palette */
  [data-theme='nord-pe7'] {
    --color-background: oklch(0.20 0.02  240);
    --color-surface:    oklch(0.26 0.022 240);
    --color-text:       oklch(0.92 0.012 240);
    --color-accent:     oklch(0.66 0.13  235);
  }
}
\`\`\`

**Three themes** ship in \`src/lib/styles/themes/\` and are switchable via \`⌘,\`:

1. **Obsidian** — near-black OLED default; high contrast, electric accent.
2. **Parchment** — warm off-white; reading mode pairs naturally with Literata.
3. **Nord-PE7** — Billy's signature OKLCH-tuned blue-slate.

**Three font families** are self-hosted (never Google Fonts CDN):

- **Inter** — UI, headings, dense surfaces.
- **JetBrains Mono** — code, snippets, terminal-style copy.
- **Literata** — reading mode and long-form node bodies.

Rules:
- OKLCH only for color. No hex, no \`rgb()\`.
- Logical properties only: \`padding-inline\`, \`margin-block\`, \`border-block-end\`.
- \`clamp()\` for any value that should fluidly scale.
- Native CSS nesting; no SCSS.
- No Tailwind; no utility classes.
- 9-tier breakpoint system: \`xs\` (320px) → \`xl5\` (3840px).
- Theme switching is instantaneous and FOUC-free (the active theme is set on \`<html data-theme>\` server-side from the user's preference cookie before first paint).

### 8.5 Forms

Every form is a Superforms + Valibot pair:
- \`superValidate(request, valibot(schema))\` on the server.
- \`superForm(data.form, { validators: valibotClient(schema) })\` on the client.
- Automatic constraint injection, tainted form detection, progressive enhancement.
- File uploads handled via \`filesFieldProxy\`.

### 8.6 Accessibility

- All interactive elements reachable by keyboard.
- Focus rings always visible (never \`outline: none\` without replacement).
- ARIA labels on icon-only buttons.
- Heading hierarchy enforced (no skipping levels).
- \`prefers-reduced-motion\` respected for all animations.
- Contrast ratio ≥ 4.5:1 for body text, ≥ 3:1 for large text.

---

## 9. Desktop Architecture (Tauri 2)

### 9.1 Shell

Tauri 2 wraps the exact same SvelteKit build that ships to Vercel. The desktop app is not a separate codebase — it's the web app in a native shell with additional capabilities exposed.

### 9.2 Additional Capabilities

- **Global hotkey (\`⌥Space\`)** — invokes quick-capture window from anywhere on the OS.
- **System tray** — Open, Quick Capture, Today's Daily, Quit.
- **Native notifications** — scheduled daily reminders, publish confirmations.
- **Menu bar mode** — live in the menu bar; click to summon.
- **Deep links** — \`lumen://node/<id>\` opens a specific node.
- **Auto-updates** — Tauri updater plugin, Ed25519-signed releases.

### 9.3 Offline-First Sync

Local SQLite stores a mirror of the user's data. On startup:
1. Sync local → remote (push pending writes).
2. Sync remote → local (pull changes since last sync).
3. Mark conflicts for resolution (last-write-wins with version history preserved).

The sync engine lives in Rust (\`src-tauri/src/sync/\`) and exposes a typed IPC surface to the web layer.

### 9.4 File Access

Tauri's scoped filesystem API is used for:
- Importing folders of Markdown files as Nodes.
- Attaching images and files to Nodes.
- Exporting the full user graph (JSON + Markdown).

Permissions are declared in \`tauri.conf.json\` with minimal scope.

---

## 10. Observability

### 10.1 Errors

Sentry captures every unhandled exception, both server and client, via the official SvelteKit integration. Source maps are uploaded at build time so production stack traces resolve to original source.

**What Sentry sees:**
- Server errors from \`hooks.server.ts:handleError\`
- Client errors from the global error boundary
- Unhandled promise rejections
- Performance spans for slow routes

**What Sentry never sees:**
- User-entered content (PII, node bodies)
- Email addresses in error payloads (scrubbed pre-send)
- Session tokens or any auth credential
- Stripe secret keys or webhook secrets

### 10.2 Tracing

OpenTelemetry via SvelteKit's native \`instrumentation.server.ts\` hook. Traces cover:
- Incoming HTTP requests
- Database queries (Drizzle)
- External calls (Stripe, Resend, Anthropic)
- Webhook processing

### 10.3 Logging

Structured logs via Pino. Every log entry has:
- \`level\` (info / warn / error)
- \`timestamp\`
- \`request_id\` (propagated from hooks)
- \`user_id\` (when authenticated)
- \`event\` (short machine-readable name)
- Contextual fields

Logs flow to Vercel's log drain in production and stdout in development. No \`console.log\` in committed code — the pre-commit hook blocks it.

### 10.4 Metrics

For v1, metrics are derived from logs + Sentry. A dedicated metrics pipeline (Prometheus, Grafana Cloud) is a post-launch concern, not a pre-launch blocker.

---

## 11. Deployment Topology

### 11.1 Environments

| Environment | Branch   | URL                          | Database        | Stripe mode |
| ----------- | -------- | ---------------------------- | --------------- | ----------- |
| Production  | \`main\`    | https://lumen.so             | Neon (prod)     | Live        |
| Staging     | \`develop\` | https://staging.lumen.so     | Neon (staging)  | Test        |
| Preview     | PR branch | https://<hash>.lumen.vercel.app | Neon branch  | Test        |
| Local       | any      | http://localhost:5173        | Neon dev branch | Test        |

### 11.2 Neon Branching

Each preview deployment gets its own Neon branch. Branches are copy-on-write — creation is milliseconds, storage is cheap. This means every PR has an isolated database with production-shape data, automatically seeded on creation and destroyed on PR close.

### 11.3 Deploy Process

Production deploys are pull-request driven:
1. Feature branches merge to \`develop\` (triggers staging deploy).
2. After validation, \`develop\` merges to \`main\` via a \`release/vX.Y.Z\` PR.
3. Merge to \`main\` triggers production deploy.
4. GitHub Release is tagged post-deploy.
5. CHANGELOG \`[Unreleased]\` → new version.

Rollback is one click in Vercel (redeploy previous production build) plus, if a migration is involved, a DB migration rollback via \`drizzle-kit drop\`. See \`docs/runbooks/rollback.md\`.

### 11.4 Zero-Downtime Migrations

Every migration must be **forward-compatible for one version**. A migration that drops a column or renames a table must ship in two steps:
1. Add the new shape, dual-write, deploy.
2. Once all instances run the new code, drop the old shape, deploy.

This is non-negotiable. Breaking migrations break users.

---

## 12. Security Model

### 12.1 Threat Model

**In-scope threats:**
- Credential theft (phishing, malware, password reuse)
- Session hijacking
- CSRF, XSS, SQL injection, command injection
- Privilege escalation within the RBAC system
- Billing tampering (forged checkout sessions, coupon abuse)
- Data leakage via error messages or logs
- Supply chain (malicious dependencies)

**Out-of-scope threats:**
- Nation-state attackers with zero-day browser exploits
- Physical compromise of a user's device
- DDoS at volumes requiring Cloudflare-tier mitigation (addressed post-launch if needed)

### 12.2 Defenses

| Threat | Defense |
|---|---|
| Credential theft | Passkeys preferred; Argon2id for passwords; 2FA available; session binding |
| Session hijacking | HttpOnly + Secure + SameSite=Lax cookies; server-side session store; device fingerprint logging |
| CSRF | SvelteKit built-in CSRF protection on form actions; origin check on all mutations |
| XSS | Svelte auto-escaping; no \`{@html}\` without sanitization; strict CSP headers |
| SQL injection | Drizzle parameterized queries exclusively; no raw SQL concatenation |
| Privilege escalation | Server-authoritative permission checks; no trusting client-sent role claims |
| Billing tampering | Price IDs from DB only; Stripe webhook signature verification; idempotency keys |
| Data leakage | Structured logger redacts sensitive fields; Sentry beforeSend scrubs PII |
| Supply chain | \`pnpm audit\` in CI; Dependabot; all new deps reviewed; lockfile integrity |

### 12.3 Content Security Policy

CSP headers are set in \`hooks.server.ts\`:
- \`default-src 'self'\`
- \`script-src 'self' https://js.stripe.com\`
- \`style-src 'self' 'unsafe-inline'\` (needed for Svelte style scoping — hashed nonces planned)
- \`img-src 'self' data: https:\`
- \`connect-src 'self' https://api.stripe.com https://api.resend.com https://api.anthropic.com\`
- \`frame-src https://js.stripe.com\`
- \`object-src 'none'\`
- \`base-uri 'self'\`

### 12.4 Secrets Management

- Local: \`.env\` (gitignored). Never committed.
- Production: Vercel env vars, scoped per environment.
- CI: GitHub Actions secrets.
- Rotation: every 90 days for long-lived keys (Stripe, Resend, Anthropic). Sessions rotate on every sensitive action (password change, 2FA toggle).

---

## 13. Performance Budget

Budgets are enforced at build time where possible and in CI for runtime metrics.

| Metric | Budget | Measured by |
|---|---|---|
| First Contentful Paint | < 1.0s | Lighthouse CI |
| Largest Contentful Paint | < 1.8s | Lighthouse CI |
| Time to Interactive | < 2.5s | Lighthouse CI |
| Total JS (initial) | < 150 KB gzipped | rollup-plugin-visualizer |
| Total CSS (initial) | < 30 KB gzipped | build report |
| Command bar open latency | < 50ms | Playwright trace |
| Node save round-trip | < 200ms p95 | Sentry performance |
| Graph view 60 FPS | ≥ 30 FPS sustained with 1k nodes | manual benchmark |

### 13.1 Bundle Discipline

- No eager imports of GSAP or Motion GPU — both are loaded on first route that needs them.
- Route-level code splitting by default (SvelteKit handles this).
- \`import()\` for heavy features (AI chat, graph view, Tauri-only modules).
- No icon libraries — Iconify loads icons on demand.

### 13.2 Database Performance

- Every query EXPLAIN'd before shipping.
- N+1 detection in CI via query count assertions in integration tests.
- Prepared statements via Drizzle's compiled queries for hot paths.
- Neon autoscaling handles burst load; connection pooling via the serverless driver.

---

## 14. Scalability Strategy

Scale is earned. Lumen does not prematurely optimize. But decisions are made with scale in mind.

### 14.1 Present (0 – 10K users)

- Single Vercel project, single Neon project.
- No read replicas.
- No background job queue (cron handles weekly digests).
- Upstash Redis for rate limiting and session extension.

### 14.2 Near-term (10K – 100K users)

- Neon read replicas for heavy read paths (graph queries, search).
- Background job queue for email sends and AI processing (likely Inngest or a Neon-native queue when it ships).
- CDN caching for public published pages.
- Dedicated database branch for analytics (read-only, long-running queries).

### 14.3 Long-term (100K+ users)

- Regional Neon compute for latency-sensitive users.
- Full-text search moves off Postgres to Typesense or Meilisearch.
- Graph traversal may move to a graph-native store (only if EXPLAIN shows Postgres can't keep up).
- Observability pipeline becomes dedicated (Grafana Cloud + Tempo + Loki).

### 14.4 What Does Not Change

- Server-authoritative writes. Always.
- Dynamic pricing from the database. Always.
- Single source of truth per concept. Always.
- TypeScript strict. Always.

---

## 15. Decision Records

Every architectural decision with non-trivial consequences is recorded as an **ADR** (Architecture Decision Record) in \`docs/adr/\`. ADRs are numbered, dated, and immutable once accepted — they can be *superseded* by new ADRs but never edited.

### 15.1 ADR Index

| ADR     | Title                                            | Status   |
| ------- | ------------------------------------------------ | -------- |
| ADR-000 | Template                                         | Meta     |
| ADR-001 | Meta-framework: SvelteKit 2 over Next / Nuxt / Remix | Accepted |
| ADR-002 | Database: Neon Postgres over PlanetScale / Supabase  | Accepted |
| ADR-003 | ORM: Drizzle over Prisma / Kysely / raw SQL          | Accepted |
| ADR-004 | Authentication: Better Auth over Lucia / Auth.js     | Accepted |
| ADR-005 | Validation: Valibot over Zod                         | Accepted |
| ADR-006 | Payments: Dynamic pricing from DB, not Stripe dashboard | Accepted |
| ADR-007 | UI: Bits UI + PE7 CSS over shadcn-svelte + Tailwind  | Accepted |
| ADR-008 | Desktop: Tauri 2 over Electron                       | Accepted |
| ADR-009 | Package manager: pnpm exclusive                      | Accepted |
| ADR-010 | Lint + format: Biome over ESLint + Prettier          | Accepted |

See \`docs/adr/\` for the full text of each decision.

### 15.2 When to Write an ADR

Write an ADR when the decision:
- Affects the shape of the system (not just a local implementation choice).
- Has trade-offs worth remembering.
- Constrains future decisions (e.g. picking an ORM constrains future query patterns).
- Costs significant effort to reverse.

Do not write an ADR for:
- Local refactors.
- Dependency patch-level upgrades.
- UI copy changes.
- Bug fixes without architectural implications.

### 15.3 ADR Template

See \`docs/adr/000-template.md\`. Every ADR uses the same structure: Context → Decision → Consequences → Alternatives Considered → Status.

---

## Appendix A: Glossary

| Term | Definition |
|---|---|
| **Node** | The universal unit of content in Lumen. Everything the user creates is a Node of some type. |
| **Link** | A typed directional edge between two Nodes. |
| **Backlink** | The reverse view of a Link, computed on demand. |
| **Organization** | Top-level tenancy unit. Every resource rolls up to an org. |
| **Entitlement** | A feature flag derived from the user's subscription tier. |
| **ADR** | Architecture Decision Record. Immutable documentation of a significant decision. |
| **PE7** | Principal Engineer ICT Level 7 — the quality standard this codebase is held to. |
| **Phase** | A milestone in the topological build chain. Phases have hard dependencies on prior phases. |

---

## Appendix B: Change History

| Date | Version | Change |
|---|---|---|
| 2026-04-24 | 1.0 | Initial document created during Phase 0. |

---

<sub>This document is updated at the end of every phase. When it describes a feature not yet built, it describes the *intended* shape — not a present reality. When it describes a feature built, it describes the *actual* shape as of the last update.</sub>
