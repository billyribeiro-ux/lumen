# Claude Code — Lumen Build Handoff

> **Source:** Generated in Claude (chat) on 2026-04-24 and handed off to Claude Code to continue the build autonomously.
> **Maintainer:** Billy Ribeiro (@billyribeiro-ux)
> **Read this entire file before doing anything. Then execute.**

---

## Who You Are

You are Claude Code operating as Billy's Principal Engineer ICT Level 7 (PE7) collaborator on the **Lumen** project. Lumen is a keyboard-driven knowledge OS for builders — a personal graph of notes, tasks, decisions, specs, snippets, and daily logs, powered by SvelteKit 2 on the web and Tauri 2 on the desktop.

You are executing against the **PE7 14-Phase Topological Dependency Chain**. Phases are never skipped. Schema before seeds before auth before RBAC before CRUD. Always.

## Billy's Standards (Non-Negotiable)

1. **TypeScript strict mode** — zero `any`, zero `@ts-ignore`, zero warnings.
2. **Production-grade only** — no placeholders, no "you can add more here", no shortcuts.
3. **PE7 CSS Architecture** — OKLCH tokens, `@layer` cascade, logical properties, `clamp()` fluid type, native nesting, zero Tailwind, 9-tier breakpoints.
4. **Svelte 5 runes only** — `$state`, `$derived`, `$effect`, `$props`, `$bindable`. Snippets + `{@render}` over slots. Native events (`onclick`). `$app/state` not `$app/stores`.
5. **pnpm exclusive** — never npm, never yarn, never bun.
6. **Iconify + Phosphor/Carbon only** — never Lucide, never Heroicons.
7. **10-year longevity** — every dep is a permanent debt. Prefer stdlib.
8. **Conventional Commits** — every commit follows `type(scope): subject` with phase footer.
9. **Direct, profanity-tolerant communication** — Billy knows what he's doing. No over-explaining. No "this is just a starting point." Push back on flaws immediately.
10. **Never bring up Revolution Trading Pros, Explosive Swings, or trading topics unless Billy brings them up first.**

## Current State (as of handoff)

### Repository

- **Remote:** `https://github.com/billyribeiro-ux/lumen.git`
- **Local path:** `/Users/billyribeiro/desktop/lumen-app/lumen`
- **Branch:** `main`
- **Latest tag:** `v0.1.0` (Phase 0 milestone — released 2026-04-24)
- **Visibility:** Public
- **License:** MIT
- **Owner:** @billyribeiro-ux

### What's Already Shipped

Phase 0 foundation files already committed and pushed:

- `README.md`
- `LICENSE` (MIT)
- `.gitignore` (comprehensive: Node, SvelteKit, Tauri 2, editors, OS, secrets)
- `.env.example` (phase-organized env vars)
- `CHANGELOG.md` (Keep a Changelog 1.1.0)
- `SECURITY.md` (Contributor Covenant conduct contact at conduct@lumen.so, security reports to security@lumen.so)
- `CONTRIBUTING.md` (branch strategy, Conventional Commits, coding standards)
- `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1)
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/ISSUE_TEMPLATE/config.yml`
- `ROADMAP.md` (18 phases mapped to version milestones)
- `ARCHITECTURE.md` (comprehensive system design — OVERVIEW, PRINCIPLES, STACK, DATA MODEL, REQUEST LIFECYCLE, AUTH, BILLING, FRONTEND, DESKTOP, OBSERVABILITY, DEPLOYMENT, SECURITY, PERFORMANCE, SCALABILITY, ADR INDEX, GLOSSARY)
- `docs/adr/000-template.md`
- `docs/adr/001-meta-framework-sveltekit.md` (Accepted — SvelteKit 2 over Next/Nuxt/Remix)

**No application code exists yet.** No `package.json`, no `src/`, no SvelteKit scaffold. Only documentation.

### Where To Pick Up

**You are resuming mid-Phase 0, with 9 ADRs remaining before the SvelteKit scaffold.**

---

## Locked-In Stack (as of April 24, 2026)

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Meta-framework | SvelteKit | 2.57.x | Vercel adapter |
| UI compiler | Svelte | 5.55.x | Runes-only |
| Language | TypeScript | 5.7+ strict | `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` |
| Build | Vite | 8.x | |
| Runtime | Node.js | 22 LTS | |
| Package manager | pnpm | 10.x | Exclusive |
| Database | Neon Postgres (serverless) | — | Branching, autosuspend |
| DB driver | `@neondatabase/serverless` | 1.0.x | |
| ORM | Drizzle ORM | 0.44.x | + `drizzle-kit` |
| Auth | Better Auth | 1.6.x | Passkeys + TOTP 2FA + OAuth (Google, GitHub) + Magic links |
| Validation | Valibot | 1.x | Replaces Zod (bundle size) |
| Forms | sveltekit-superforms | 2.30.x | Valibot adapter |
| UI primitives | Bits UI | 2.17.x | Headless, Svelte 5 native |
| Styling | PE7 CSS Architecture | — | OKLCH, `@layer`, logical properties, fluid type, 9-tier breakpoints, zero Tailwind |
| Icons | Iconify (`@iconify/svelte`) | — | Phosphor + Carbon sets only |
| Animation | GSAP | 3.x | Timeline, FLIP |
| GPU shaders | `@motion-core/motion-gpu` | latest | WebGPU / WGSL for graph view + focus mode |
| Dev inspector | `sv-agentation` | 0.2.6+ | Dev-only |
| Payments | Stripe | 22.x | Dynamic pricing from DB (DB is source of truth) |
| Email | Resend | — | Svelte-rendered templates |
| AI | Anthropic Claude | `claude-opus-4-7` | In-app co-pilot, per-tier quota |
| Cache | Upstash Redis (REST) | — | Rate limiting, session extension, entitlement cache |
| Observability | Sentry + OpenTelemetry | — | Native SvelteKit integration |
| Lint + Format | Biome | 2.x | Replaces ESLint + Prettier |
| Git hooks | lefthook | — | |
| Testing unit | Vitest | 3.x | Browser mode enabled |
| Testing E2E | Playwright | 1.50+ | |
| Commit linting | commitlint | — | Conventional Commits |
| Secret scanning | gitleaks | — | lefthook + CI |
| Svelte MCP | `@sveltejs/mcp` | — | Official, installed via `npx sv add mcp` |
| Desktop | Tauri | 2.x | Wraps same SvelteKit build |
| Desktop local DB | SQLite (Tauri SQL plugin) | — | Offline-first sync |
| Deploy | Vercel | — | `@sveltejs/adapter-vercel` 5.x |

## Domain Model

Lumen's universe is a **typed bidirectional graph**. Everything is a `Node` of some type: `note`, `task`, `decision`, `spec`, `snippet`, `link`, `person`, `project`, `daily`. Nodes connect via typed `links` (`references`, `blocks`, `related`, `supersedes`, `derives_from`, `embeds`). Content is stored separately from node headers (`node_content` + `node_versions`). Full-text search via Postgres `tsvector`. Organizations own all resources; users have memberships with roles (`owner`, `admin`, `editor`, `viewer`). Subscriptions (free/pro/studio) drive entitlements which gate features.

See `ARCHITECTURE.md` for the complete data model, request lifecycle, billing architecture, and security model.

## Feature Set (from ROADMAP.md)

- Command bar (`⌘K`)
- Graph view with WebGPU shaders (`⌘G`)
- Daily note (`⌘D`) — auto-created
- Quick capture global hotkey (`⌥Space`, desktop only)
- Split panes (`⌘\`)
- AI co-pilot grounded in user's graph (`⌘J`)
- Focus mode with ambient shader (`⌘.`)
- One-keystroke publish (`⌘⇧P`) — public subdomain sharing
- Snippet library (`⌘⇧S`)
- Decision log / ADRs (`⌘⇧D`)
- Smart inbox (`⌘I`)
- Timeline (`⌘T`)
- 30-day free Pro trial on signup, no card required
- Tiers: Free ($0), Pro ($20/mo), Studio ($40/mo)

---

## The PE7 14-Phase Build Sequence

You MUST execute in strict topological order. Never skip. Never reorder.Phase 0  → Foundation & Environment          (in progress)
Phase 1  → Database Schema
Phase 2  → Database Seeding
Phase 3  → Authentication
Phase 4  → RBAC & Permissions
Phase 5  → Validation & Security
Phase 6  → Core CRUD
Phase 7  → Email Service
Phase 8  → Stripe Foundation
Phase 9  → Billing Services
Phase 10 → Stripe & Plan Seeding
Phase 11 → Pricing Page & Checkout
Phase 12 → Customer Portal
Phase 13 → Tier-Based Access Control
Phase 14 → Testing & CI/CD Hardening
Phase 15 → Tauri 2 Desktop App          (post v1.0.0)
Phase 16 → AI Co-Pilot
Phase 17 → Graph View (WebGPU)
Phase 18 → Public PublishingEach phase completion:
1. Update `CHANGELOG.md` (move `[Unreleased]` entries into a new version block).
2. Bump `package.json` version.
3. Tag: `git tag -a vX.Y.Z -m "vX.Y.Z — Phase N: <description>"`.
4. Push tag: `git push origin vX.Y.Z`.
5. Create GitHub Release: `gh release create vX.Y.Z --title "..." --notes "..."`.
6. Update `ROADMAP.md` to mark phase shipped.

---

## Conventional Commits Format<type>(<scope>): <subject under 72 chars>
<body wrapped at 100 chars — what and why, not how>
Phase: <N>
Refs: PE7-<AREA>Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `perf`, `test`, `style`, `build`, `ci`, `revert`.

Scopes: `auth`, `db`, `schema`, `seed`, `rbac`, `validation`, `crud`, `email`, `billing`, `stripe`, `checkout`, `portal`, `entitlements`, `ui`, `editor`, `graph`, `command-bar`, `ai`, `desktop`, `tauri`, `ci`, `deploy`, `docs`, `test`.

---

## Immediate Tasks (In Order)

### Task 1: Complete Phase 0 — Remaining ADRs (9 files)

Create each ADR following the structure in `docs/adr/000-template.md` and the style of the already-complete `docs/adr/001-meta-framework-sveltekit.md`. Each ADR is a standalone file, ~120–160 lines, with Context, Decision, Consequences (positive/negative/neutral), Alternatives Considered (at least 2 realistic + "do nothing"), Implementation Notes, References, and Revision History.

Create these files in order. Commit each one individually with a Conventional Commits message (`docs(adr): ADR-NNN <title> — <one-line rationale>`). Push after each commit.

- **ADR-002** `docs/adr/002-database-neon-postgres.md` — Neon Postgres over PlanetScale, Supabase, Cloudflare D1, and self-hosted Postgres. Justify via branching for preview envs, autosuspend economics, serverless driver for edge, first-class Drizzle support.

- **ADR-003** `docs/adr/003-orm-drizzle.md` — Drizzle over Prisma, Kysely, raw SQL, and TypeORM. Justify via SQL-first design, zero runtime overhead, honesty about what it does, edge compatibility, generated types flowing to queries.

- **ADR-004** `docs/adr/004-authentication-better-auth.md` — Better Auth over Lucia, Auth.js (NextAuth), Clerk, and custom. Justify via framework-agnostic design, Drizzle adapter, native passkey + TOTP + OAuth + magic link in one library, session ownership on our DB (not vendor lock-in).

- **ADR-005** `docs/adr/005-validation-valibot.md` — Valibot over Zod 4, Arktype, TypeBox, and Yup. Justify via ~1KB vs ~14KB bundle size, tree-shakability, first-class Superforms adapter, equivalent DX to Zod for 95% of cases.

- **ADR-006** `docs/adr/006-dynamic-pricing-from-database.md` — DB is source of truth for products/prices; Stripe is a processor. Justify via single source of truth, no dashboard drift, reproducible environments, migration safety. This is a foundational billing architecture decision, not just a choice of library.

- **ADR-007** `docs/adr/007-ui-primitives-bits-ui.md` — Bits UI over shadcn-svelte, Skeleton, Melt UI directly, and rolling custom. Justify via headless+Svelte 5 native, WAI-ARIA built-in, no Tailwind dependency (pairs with PE7 CSS cleanly), strong primitive coverage (Dialog, Combobox, Select, Menu, DatePicker, PinInput).

- **ADR-008** `docs/adr/008-desktop-tauri-2.md` — Tauri 2 over Electron, Neutralino, and native platform builds. Justify via Rust backend (smaller footprint, faster cold start), same SvelteKit build powers web + desktop, native menus/tray/global-hotkeys/notifications, Ed25519-signed auto-updater.

- **ADR-009** `docs/adr/009-package-manager-pnpm.md` — pnpm exclusive over npm, yarn, bun. Justify via deterministic installs, disk efficiency, monorepo-ready (future-proofing), strict peer dependency resolution, widely adopted in professional open source (SvelteKit itself uses it).

- **ADR-010** `docs/adr/010-lint-format-biome.md` — Biome over ESLint + Prettier combo. Justify via single tool (faster CI, less config drift), 10x speed, native TypeScript understanding, maintained by Rome team (stable governance), handles both lint and format with one config file.

After all 10 ADRs exist, update `docs/adr/` with a brief `docs/adr/README.md` indexing all ADRs with status.

### Task 2: Close out Phase 0 — Documentation milestone

Update `CHANGELOG.md`: add a new entry under `[Unreleased]` for all ADR work + the ADR README.

Commit with:docs(adr): complete Phase 0 ADR-001 through ADR-010

Document 10 foundational architectural decisions
Add docs/adr/README.md as index
Update CHANGELOG with Phase 0 closure notes

Phase: 0
Refs: PE7-FOUNDATION
Then push. Phase 0 is now fully documented. We DO NOT bump the version here — the scaffold comes next and THAT bumps us to v0.2.0.

### Task 3: Phase 1 — Database Schema

This is where application code begins. Follow this order inside Phase 1. Each numbered step is a single commit.

**1.1** Run `pnpm dlx sv@latest create .` (create in-place since the repo already has files). Select: SvelteKit minimal, TypeScript syntax, Prettier + ESLint — **wait, skip ESLint** we're using Biome. Select just: TypeScript, Prettier (for markdown/yaml), Vitest, Playwright. When it asks about preserving existing files, answer YES (our docs must survive).

**1.2** Remove Prettier config if installed (we use Biome). Install Biome: `pnpm add -D -E @biomejs/biome@latest` then `pnpm biome init`. Configure `biome.json` for PE7 standards (strict TypeScript rules, 2-space indent, 100 char line width, single quotes for JS, double for JSX/HTML, no semicolons OFF — we use semicolons always, trailing comma "all").

**1.3** Install lefthook: `pnpm add -D lefthook` then create `lefthook.yml` with hooks for `pre-commit` (Biome lint+format, svelte-check, gitleaks) and `commit-msg` (commitlint).

**1.4** Install commitlint + conventional config: `pnpm add -D @commitlint/cli @commitlint/config-conventional` and create `commitlint.config.js` referencing conventional config. Ensure the scopes match CONTRIBUTING.md.

**1.5** Install gitleaks config: `pnpm add -D gitleaks` (or document that it's installed via Homebrew as a prereq). Add `.gitleaks.toml` with sensible rules.

**1.6** Install Vercel adapter: `pnpm add -D @sveltejs/adapter-vercel@latest`. Update `svelte.config.js` to use it.

**1.7** Install the Svelte MCP via `npx sv add mcp`. This creates `AGENTS.md` (or `CLAUDE.md`) with the Svelte MCP usage prompt. Verify its contents; enhance it with Lumen-specific guardrails (PE7 standards, banned patterns).

**1.8** Install DB deps: `pnpm add drizzle-orm @neondatabase/serverless` and `pnpm add -D drizzle-kit`.

**1.9** Create `drizzle.config.ts` at repo root pointing to `src/lib/server/db/schema/` with Postgres dialect.

**1.10** Create schema directory structure:src/lib/server/db/
├── index.ts           # Drizzle instance factory
├── schema/
│   ├── index.ts       # Re-exports all schema
│   ├── auth.ts        # users, sessions, accounts, verification (Better Auth shape)
│   ├── organizations.ts  # organizations, memberships, invitations
│   ├── rbac.ts        # roles, permissions, role_permissions
│   ├── nodes.ts       # nodes, node_content, node_versions, node_types enum
│   ├── links.ts       # links, relation_type enum
│   ├── tags.ts        # tags, node_tags
│   ├── decisions.ts   # decisions (ADR satellite table)
│   ├── snippets.ts    # snippets
│   ├── dailies.ts     # dailies
│   ├── publications.ts # publications
│   ├── inbox.ts       # inbox_items
│   ├── billing.ts     # products, prices, subscriptions, invoices, payment_methods, entitlements
│   ├── audit.ts       # audit_log
│   └── webhooks.ts    # webhook_eventsEvery table:
- UUID primary keys (`pgTable` with `uuid('id').primaryKey().defaultRandom()`).
- `created_at`, `updated_at` timestamps (timestamptz).
- `deleted_at` timestamptz on user-facing resources (soft delete).
- Foreign keys with explicit indexes.
- `organization_id` on every user-scoped resource (tenancy).

**1.11** Generate initial migration: `pnpm drizzle-kit generate --name=initial_schema`. Inspect the generated SQL in `drizzle/` for correctness. Adjust schema and regenerate if needed.

**1.12** Create `src/lib/server/db/index.ts` exporting a Drizzle instance backed by `@neondatabase/serverless`'s `neon()` HTTP client, reading `DATABASE_URL` from `$env/dynamic/private`.

**1.13** Add `package.json` scripts:
```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio",
"db:push": "drizzle-kit push"
```

**1.14** Update `.env.example` if new vars are needed (should not be — `DATABASE_URL` already documented).

**1.15** Write `docs/runbooks/database-migrations.md` — how to add a migration, how to roll back, the zero-downtime migration rule (forward-compatible for one version before breaking).

**1.16** Update `CHANGELOG.md` [Unreleased] with Phase 1 entries.

**1.17** Phase 1 completion commit sequence:
- Tag: `v0.2.0 — Phase 1: Database Schema`
- GitHub Release with changelog contents.
- Update `ROADMAP.md` to mark Phase 1 shipped.
- Commit + push tag + create release.

---

## Phases 2 through 18

Continue through each phase following the same discipline. At the end of each phase:
- Bump version in `package.json` (minor bump for new phase).
- Update `CHANGELOG.md` with the new version section.
- Update `ROADMAP.md` status.
- Tag and release.
- Write an ADR for any significant architectural decision made during the phase.
- Write a runbook for any new operational task introduced (deploy, rollback, webhook replay, etc.).

For each phase, reference `ARCHITECTURE.md` as the source of truth for design intent. If you find yourself deviating from `ARCHITECTURE.md`, STOP and write an ADR documenting the deviation before proceeding. Living document discipline.

---

## Communication Protocol with Billy

When you need Billy's input (decisions that affect product direction, branding, copy, pricing specifics, domain names, integrations requiring his account access):
- Stop.
- Ask a tight, specific question with 2–4 labeled options.
- Wait.

When the work is well-defined and purely technical:
- Execute.
- Commit.
- Move on.

When you hit ambiguity in this handoff doc itself:
- Prefer the most PE7-aligned interpretation.
- Document the interpretation in a commit body or ADR.
- Do not stall for clarification on execution details.

Billy is direct and values speed + correctness. Don't ask permission for obvious next steps. Don't over-explain after completing a task — show the commit and move on.

---

## Known Context You Should Have

- Billy's Mac Studio is his primary dev machine.
- pnpm is already installed globally.
- GitHub CLI (`gh`) is installed and authenticated.
- Billy uses Claude Code 2.1.104+ at `~/.local/bin/claude`.
- Billy's GitHub username is `billyribeiro-ux`.
- The repo is at `/Users/billyribeiro/desktop/lumen-app/lumen` locally.
- Do NOT create a `.env` file programmatically — it exists locally (Billy copied `.env.example` → `.env`). You only edit `.env.example` when adding new variables.
- Do NOT ever commit `.env`. Verify it's gitignored before any commit.

---

## One-line summary

**Resume at ADR-002 in `docs/adr/`. Execute 9 more ADRs. Then scaffold SvelteKit in-place. Then Phase 1 schema. Then everything else through v2.0.0. Commit everything with Conventional Commits. Tag every phase. Update CHANGELOG + ROADMAP on every phase close. Ship it.**

---

*End of handoff.*
