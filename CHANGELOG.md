# Changelog

All notable changes to **Lumen** will be documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- _Features in progress for the next release go here._

### Changed
- _Modifications to existing functionality._

### Deprecated
- _Features scheduled for removal._

### Removed
- _Features removed in this release._

### Fixed
- _Bug fixes._

### Security
- _Vulnerability fixes and hardening._

---

## [0.5.0] — 2026-04-24

> **Phase 4 — RBAC & Permissions**
> Server-authoritative role-based access control + invite flow.

### Added

- `src/lib/server/rbac.ts` — `can(ctx, key)`, `requirePermission(ctx, key)`,
  `getRoleForOrg`, `permissionsForOrg`, `outranks` helpers. Single SQL
  query per check; owner role short-circuits.
- `src/lib/server/auth-helpers.ts` — `requireUser`, `requireMember`,
  `requireOrgRole`, `requirePermissionFor` for use in `+page.server.ts`
  and `+server.ts` files. All throw SvelteKit's `error()` / `redirect()`.
- `src/lib/server/invitations.ts` — `issueInvitation()` (192-bit
  url-safe base64 token, 7-day TTL, revokes prior pending) +
  `acceptInvitation()` (atomic membership-insert + invite-stamp under
  `dbTransact`).
- Anonymous route guard in `src/hooks.server.ts` — public allowlist
  (auth routes, `/`, `/pricing`, `/about`, `/p/*`, `/invite/*`); all
  other routes redirect to `/sign-in?next=<path>`.
- `/account/team` — member list, org switcher (defaulting to the user's
  owner-org), pending invites, invite form, role badges, remove-member
  action with last-owner guard.
- `/invite/[token]` — six-state accept page (not-found / expired /
  revoked / accepted / pending-anon / pending-wrong-account / pending).
  Anonymous users redirect to sign-in with the invite URL preserved.

### Notes

- Default permission matrix from the Phase 2 seed governs roles. Owner
  always wins; admin holds org-management + billing-management; editor
  holds node CRUD + AI; viewer holds `node.read` only.
- Email delivery for invitations logs to stderr in dev. Phase 7 wires
  Resend with a Svelte-rendered template.

> **Phase 4 status:** ✅ shipped. Next: Phase 5 — Validation & Security.

---

## [0.4.0] — 2026-04-24

> **Phase 3 — Authentication**
> Better Auth wired with passkeys, TOTP 2FA, OAuth (Google + GitHub),
> magic links, and email + password — all with sessions persisted in
> Postgres.

### Added

- `src/lib/server/auth.ts` — Better Auth instance with the Drizzle
  adapter, Argon2id hashing (`@node-rs/argon2`, OWASP 2024 params),
  and three plugins: `twoFactor`, `magicLink` (15-min TTL), and
  `passkey` (`@better-auth/passkey`). Production startup refuses
  to run without OAuth credentials.
- `src/lib/server/auth-bridge.ts` — `copyAuthCookies()` helper that
  forwards Better Auth's `Set-Cookie` headers onto the SvelteKit
  request event so form-action sign-ins set cookies before redirecting.
- `src/hooks.server.ts` — request-level session resolution that hydrates
  `event.locals.{user, session}` and structured `handleError` logger
  emitting `errorId` for cross-correlation (Sentry wires in Phase 14).
- `src/app.d.ts` — typed `App.Locals` (user + session) and `App.Error`.
- `src/routes/api/auth/[...all]/+server.ts` — Better Auth catch-all.
- `src/lib/auth-client.ts` — browser-side `createAuthClient` with
  passkey, magicLink, and twoFactor plugins.
- Auth route group:
  - `src/routes/(auth)/+layout.svelte` — shared visual frame.
  - `src/routes/(auth)/sign-in/` — password form action + progressive
    enhancement for OAuth + magic-link.
  - `src/routes/(auth)/sign-up/` — name + email + password (12+ chars).
  - `src/routes/(auth)/forgot-password/` — enumeration-safe reset
    request flow.
  - `src/routes/(auth)/reset-password/` — token-based reset.
  - `src/routes/(auth)/verify-email/` — landing after sign-up.
- `src/routes/account/security/` — sessions list, passkey registration,
  sign-out-everywhere form action, single-session sign-out.
- Schema additions in `src/lib/server/db/schema/auth.ts`:
  - `passkeys` table for the `@better-auth/passkey` plugin.
  - `two_factor` table for TOTP secrets and backup codes.
- `drizzle/0001_auth_plugin_tables.sql` — generated migration.
- `.env.example` — added passkey RP id, cookie domain, trusted-origins
  list, and `ALLOW_DESTRUCTIVE_DB_OPS` documentation.

### Notes

- Email delivery (verification, password reset, magic link) is logged
  to stderr in dev. Phase 7 (`v0.8.0`) wires Resend with Svelte-rendered
  templates.
- The Phase 2 seeded credential accounts (Argon2id-hashed default
  password `LumenDev2026!`) are signable via the new sign-in form
  out of the box.
- Better Auth's session cookie is `lumen.session_token`. Cookie
  domain is settable via `LUMEN_COOKIE_DOMAIN` for Phase 18 subdomain
  publishing.

> **Phase 2 status:** ✅ Database seeding shipped (v0.3.0).
> **Phase 3 status:** ✅ Authentication shipped. Next: Phase 4 — RBAC & Permissions (targets v0.5.0).

---

## [0.3.0] — 2026-04-24

> **Phase 2 — Database Seeding**
> Reproducible dev data on top of the Phase 1 schema.

### Added

- `scripts/seed/` — full database seed authored as TypeScript scripts
  driven by `tsx`. Idempotent on every run; aborts on any production
  signal via the three-guard model (`NODE_ENV` + `ALLOW_DESTRUCTIVE_DB_OPS`
  + hostname pattern).
- **3 organizations** (`Lumen Labs` studio / `Indie Studio` pro / `Free Hacker` free).
- **15 user personas** across owner / admin / editor / viewer roles
  including 5 trial users with their own one-person workspaces.
  Default password `LumenDev2026!` hashed with Argon2id (OWASP 2024
  parameters) — sign-in becomes functional once Phase 3 wires Better
  Auth.
- **4 RBAC roles** (owner / admin / editor / viewer) and **16 permission
  keys** wired into the default role-permission matrix (e.g. `node.read`,
  `node.publish`, `org.invite`, `billing.manage`, `ai.chat`).
- **Billing catalog**: 3 products (free / pro / studio) and 4 prices
  (pro monthly + annual, studio monthly + annual). Stripe IDs left null
  until `pnpm stripe:sync` (Phase 8).
- **Sample content**: ~15 nodes spanning every node type, 11 tags, daily
  notes for org owners across the past 3 days, inbox items for Lumen
  Labs users, 3 typed inter-node links, 6 tag assignments. Decision
  and snippet satellite tables populated.
- **Tier-correct entitlements** for every user (studio / pro / free /
  pro-trial-with-`trial_ends_at`).
- `pnpm db:seed`, `pnpm db:wipe`, `pnpm db:reset` scripts.
- `docs/runbooks/database-seeding.md` — runbook covering idempotency,
  preview-branch usage, fixture extension, and production safety.
- `@node-rs/argon2` (Argon2id hashing, OWASP 2024 params) and `tsx` +
  `@types/node` added as dev dependencies.
- `kit.typescript.config` hook in `svelte.config.js` so `pnpm check`
  covers `scripts/**` and `drizzle.config.ts`.

### Changed

- `biome.json` — `complexity/useLiteralKeys` disabled because it
  conflicted with TypeScript's `noPropertyAccessFromIndexSignature`
  rule on `process.env.*` access. We choose the tighter guarantee
  from TypeScript over Biome's stylistic preference.

### Deprecated
- _None._

### Removed
- _None._

### Fixed
- _None._

### Security
- All seed users carry an Argon2id-hashed credential account; the
  default password is published deliberately for dev convenience and
  will refuse to insert against any production-shaped DB connection
  (see `scripts/seed/guard.ts`).

> **Phase 1 status:** ✅ Database schema shipped (v0.2.0).
> **Phase 2 status:** ✅ Database seeding shipped. Next: Phase 3 — Authentication (targets v0.4.0).

---

## [0.2.0] — 2026-04-24

> **Phase 1 — Database Schema**
> Application code begins. SvelteKit scaffolded with PE7 strict tooling;
> 31-table Drizzle schema authored; initial migration generated.

### Added

#### Phase 0 closure — Architecture Decision Records
- `docs/adr/002-database-neon-postgres.md` — Neon Postgres over Supabase, Cloudflare D1, and self-hosted Postgres.
- `docs/adr/003-orm-drizzle.md` — Drizzle ORM over Prisma, Kysely, raw SQL, and TypeORM.
- `docs/adr/004-authentication-better-auth.md` — Better Auth over Lucia, Auth.js, and Clerk.
- `docs/adr/005-validation-valibot.md` — Valibot over Zod, Arktype, TypeBox, and Yup.
- `docs/adr/006-dynamic-pricing-from-database.md` — Database is the source of truth for products and prices; Stripe is a payment processor.
- `docs/adr/007-ui-primitives-bits-ui.md` — Bits UI over shadcn-svelte, Skeleton, raw Melt UI, and rolling custom.
- `docs/adr/008-desktop-tauri-2.md` — Tauri 2 over Electron, Neutralino, and native platform builds.
- `docs/adr/009-package-manager-pnpm.md` — pnpm exclusive over npm, yarn, and bun.
- `docs/adr/010-lint-format-biome.md` — Biome over ESLint + Prettier.
- `docs/adr/README.md` — index of all ADRs with status, phase, and date.

#### Product source of truth
- `docs/LUMEN_VISION.md` — complete product vision and specification (one-liner, target user, market positioning, 12 headline features, complete keyboard shortcut map, three themes, typography, pricing tiers, Tauri capabilities, 31-table data model summary, branding, forbidden UI patterns, success metrics).

#### Build log discipline
- `docs/BUILD_LOG.md` — strict chronological per-commit, per-file build log seeded with the existing Phase 0 inventory and maintained going forward (one row per file per commit; the BUILD_LOG commit itself gets a row).

#### Documentation reconciliation
- ARCHITECTURE.md §4.9 added describing AI co-pilot tables (`ai_conversations`, `ai_messages`).
- ARCHITECTURE.md §8.4 expanded to include three self-hosted fonts (Inter, JetBrains Mono, Literata) and three themes in OKLCH (Obsidian default OLED, Parchment, Nord-PE7) wired through a `[data-theme]` attribute.
- ROADMAP.md Phase 1 deliverables now enumerate the full 31-table target across 8 domains.

#### Phase 1 — Application scaffold + data model (targets v0.2.0)
- SvelteKit 2.58 + Svelte 5.55 scaffold (runes mode forced; minimal template) with TypeScript strict mode extended to `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature`.
- Vercel adapter 6.3 (`@sveltejs/adapter-vercel`) swapped in for `adapter-auto`. Runtime `nodejs22.x`, default region `iad1`, AVIF + WebP image sizes.
- Biome 2.4 configured with PE7 lint + format rules (2-space indent, 100-char width, single quotes, semicolons, trailing commas; `noExplicitAny=error`, `noConsole` scoped stricter inside `src/lib/server/`). Prettier retained solely for `*.svelte` formatting via `.prettierignore` exclusion.
- lefthook hooks: pre-commit runs Biome auto-fix, Prettier on `*.svelte`, `svelte-check` (fail on warnings), gitleaks (soft-skipped locally when the binary is missing), and a guard that rejects commits introducing `package-lock.json` / `yarn.lock` / `bun.lockb`. commit-msg runs commitlint.
- commitlint with `@commitlint/config-conventional` + the Lumen scope list from CONTRIBUTING.md.
- gitleaks 8.x config (`.gitleaks.toml`) extending the default rule set with Lumen-specific patterns for Neon connection strings, Stripe sk/rk/pk keys, Anthropic Claude keys, Resend keys, Upstash Redis tokens, BETTER_AUTH_SECRET values, and Tauri updater Ed25519 private keys.
- Svelte MCP server wired (`sv add mcp`) + Lumen-augmented `CLAUDE.md` encoding PE7 standards, forbidden UI patterns, and the build-log discipline rule.
- Drizzle ORM 0.45 + drizzle-kit 0.31 + `@neondatabase/serverless` 1.1 + `ws` for Node transport.
- `drizzle.config.ts` at repo root (snake_case, strict, verbose).
- **31-table data model authored across 15 schema modules** in `src/lib/server/db/schema/`:
  - Auth (4): `users`, `sessions`, `accounts`, `verification` (Better Auth shape).
  - Organizations (3): `organizations`, `memberships`, `invitations`.
  - RBAC (3): `roles`, `permissions`, `role_permissions`.
  - Content (6): `nodes`, `node_content`, `node_versions`, `links`, `tags`, `node_tags`.
  - Satellites (5): `decisions`, `snippets`, `dailies`, `publications`, `inbox_items`.
  - AI co-pilot (2): `ai_conversations`, `ai_messages`.
  - Billing (6): `products`, `prices`, `subscriptions`, `invoices`, `payment_methods`, `entitlements`.
  - System (2): `audit_log`, `webhook_events`.
  - Shared helpers: `_columns.ts` (`idColumn`, `createdAt`, `updatedAt`, `deletedAt`, `timestamps()`, `auditTimestamps()`).
- Initial Drizzle migration (`drizzle/0000_initial_schema.sql`) — 507 lines, 13 enums, 31 tables, 68 indexes, 41 foreign-keys, 1 CHECK constraint (links no-self-link).
- Drizzle instance factory (`src/lib/server/db/index.ts`) with `db` (HTTP, edge-safe) and `dbTransact(fn)` (WebSocket Pool, multi-statement transactions).
- `pnpm db:*` scripts: `generate`, `migrate`, `push`, `studio`, `check`.
- Database migration runbook (`docs/runbooks/database-migrations.md`) covering the zero-downtime rule, forward-only rollback policy, preview-branch workflow, and emergency procedures.
- `CLAUDE.md` ships alongside the SvelteKit MCP for agentic development workflows.

### Changed

- LUMEN_VISION.md "22 Tables" header corrected to "31 tables across 8 domains"; "Content (5 tables)" subheading corrected to "Content (6 tables)" to match the enumerated list.
- `svelte.config.js` `csrf.checkOrigin` migrated to `csrf.trustedOrigins: []` per SvelteKit 2.58 deprecation.

### Deprecated
- _None._

### Removed
- _None._

### Fixed
- _None._

### Security
- _None._

> **Phase 0 status:** ✅ Documentation foundation complete (shipped with `v0.2.0` as part of this Phase 1 release).
> **Phase 1 status:** ✅ Database schema foundation shipped. Next: Phase 2 — Database Seeding (targets `v0.3.0`).

---

## [0.1.0] — 2026-04-24

> **Phase 0 — Foundation & Environment**
> Initial project scaffolding and repository baseline.

### Added
- Project repository initialized under `billyribeiro-ux/lumen`.
- `README.md` with product overview, tech stack, build methodology, and feature highlights.
- MIT `LICENSE` (SPDX-compliant).
- Comprehensive `.gitignore` covering Node, SvelteKit, Tauri 2 / Rust, editors (VS Code, Cursor, Windsurf, JetBrains, Vim), OS artifacts (macOS, Windows, Linux), secrets, and test outputs.
- `.env.example` documenting all environment variables organized by build phase (database, auth, email, payments, AI, observability, desktop signing).
- GitHub repository metadata: description, homepage, topics, discussions enabled, wiki disabled.
- Conventional Commits workflow established as project standard.
- PE7 14-phase topological build methodology adopted.

### Infrastructure
- Repository visibility: public.
- Default branch: `main`.
- License: MIT.
- Package manager standard: pnpm 10.x (exclusive).
- Runtime standard: Node 22 LTS.

---

<!-- ══════════════════════════════════════════════════════════════
     Release Link Definitions
     Update these with each new release tag.
     ══════════════════════════════════════════════════════════════ -->

[Unreleased]: https://github.com/billyribeiro-ux/lumen/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/billyribeiro-ux/lumen/releases/tag/v0.5.0
[0.4.0]: https://github.com/billyribeiro-ux/lumen/releases/tag/v0.4.0
[0.3.0]: https://github.com/billyribeiro-ux/lumen/releases/tag/v0.3.0
[0.2.0]: https://github.com/billyribeiro-ux/lumen/releases/tag/v0.2.0
[0.1.0]: https://github.com/billyribeiro-ux/lumen/releases/tag/v0.1.0
