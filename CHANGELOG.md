# Changelog

All notable changes to **Lumen** will be documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

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

### Changed

- LUMEN_VISION.md "22 Tables" header corrected to "31 tables across 8 domains"; "Content (5 tables)" subheading corrected to "Content (6 tables)" to match the enumerated list.

### Deprecated
- _None._

### Removed
- _None._

### Fixed
- _None._

### Security
- _None._

> **Phase 0 status:** Documentation foundation complete. No application code yet. Next: Phase 1 (Database Schema) → SvelteKit scaffold + Drizzle schema → release `v0.2.0`.

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

[Unreleased]: https://github.com/billyribeiro-ux/lumen/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/billyribeiro-ux/lumen/releases/tag/v0.1.0
