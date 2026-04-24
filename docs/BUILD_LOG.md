# Lumen Build Log

> **Purpose:** A strict chronological log of every file created, in order, across every phase of the Lumen build.
> **Rule:** Every file creation, modification, or deletion MUST be appended to this log immediately after the git commit that introduces it.
> **Format:** `| # | Date | Phase | File path | Commit hash | Conventional Commit subject |`
> **Maintainer rule:** This file is append-only. Never reorder rows. Never delete rows. If a file is later deleted or renamed, append a new row documenting that change.

---

## Phase 0 — Foundation & Environment (In Progress)

| # | Date | Phase | File | Commit | Subject |
|---|---|---|---|---|---|
| 1 | 2026-04-24 | 0 | `README.md` | d997b6c | docs: add project README with overview, stack, and getting started |
| 2 | 2026-04-24 | 0 | `LICENSE` | 0765749 | chore: add MIT license |
| 3 | 2026-04-24 | 0 | `.gitignore` | 0e0a972 | chore: add comprehensive .gitignore |
| 4 | 2026-04-24 | 0 | `.env.example` | 11d02a3 | chore: add .env.example with phase-organized variables |
| 5 | 2026-04-24 | 0 | `CHANGELOG.md` | 9c8e992 | docs: add CHANGELOG following Keep a Changelog spec |
| 6 | 2026-04-24 | 0 | `SECURITY.md` | 7d82dc0 | docs: add security policy and vulnerability disclosure process |
| 7 | 2026-04-24 | 0 | `CONTRIBUTING.md` | 7de5825 | docs: add comprehensive contributing guide |
| 8 | 2026-04-24 | 0 | `CODE_OF_CONDUCT.md` | (next) | docs: add Contributor Covenant 2.1 code of conduct |
| 9 | 2026-04-24 | 0 | `.github/PULL_REQUEST_TEMPLATE.md` | (next) | chore(ci): add PR template with PE7 review checklist |
| 10 | 2026-04-24 | 0 | `.github/ISSUE_TEMPLATE/bug_report.md` | (next) | chore(ci): add structured issue templates with routing config |
| 11 | 2026-04-24 | 0 | `.github/ISSUE_TEMPLATE/feature_request.md` | (next) | (same commit as #10) |
| 12 | 2026-04-24 | 0 | `.github/ISSUE_TEMPLATE/config.yml` | (next) | (same commit as #10) |
| 13 | 2026-04-24 | 0 | `ROADMAP.md` | (next) | docs: add public roadmap with phase-to-version mapping |
| 14 | 2026-04-24 | 0 | `ARCHITECTURE.md` | (next) | docs: add comprehensive architecture document |
| 15 | 2026-04-24 | 0 | `docs/adr/000-template.md` | 5abc248 | docs(adr): add ADR template based on Nygard format |
| 16 | 2026-04-24 | 0 | `docs/adr/001-meta-framework-sveltekit.md` | 3a467bc | docs(adr): ADR-001 meta-framework SvelteKit 2 over Next/Nuxt/Remix |
| 17 | 2026-04-24 | 0 | `docs/handoffs/2026-04-24-phase-0-handoff.md` | 4948457 | docs(handoff): add Phase 0 → Phase 18 handoff brief for Claude Code |
| 18 | 2026-04-24 | 0 | `docs/BUILD_LOG.md` | 62cc428 | docs: initialize build log with current file inventory |
| 19 | 2026-04-24 | 0 | `docs/handoffs/CLAUDE_CODE_PROMPT.md` | 2d0a15f | docs(handoff): add Claude Code entry prompt |
| 20 | 2026-04-24 | 0 | `docs/adr/002-database-neon-postgres.md` | e9d3855 | docs(adr): ADR-002 database Neon Postgres over Supabase/D1/self-host |
| 21 | 2026-04-24 | 0 | `docs/BUILD_LOG.md` | 6154e68 | docs(log): record ADR-002 and CLAUDE_CODE_PROMPT in build log |
| 22 | 2026-04-24 | 0 | `docs/adr/003-orm-drizzle.md` | 8cdb1b9 | docs(adr): ADR-003 ORM Drizzle over Prisma/Kysely/raw SQL |
| 23 | 2026-04-24 | 0 | `docs/BUILD_LOG.md` | f59e26f | docs(log): record ADR-003 in build log |
| 24 | 2026-04-24 | 0 | `docs/adr/004-authentication-better-auth.md` | ea64780 | docs(adr): ADR-004 authentication Better Auth over Lucia/Auth.js/Clerk |
| 25 | 2026-04-24 | 0 | `docs/BUILD_LOG.md` | 37bc6e2 | docs(log): record ADR-004 in build log |
| 26 | 2026-04-24 | 0 | `ARCHITECTURE.md` | 51ed998 | docs: reconcile ARCHITECTURE/ROADMAP/VISION on AI tables, themes, fonts |
| 27 | 2026-04-24 | 0 | `ROADMAP.md` | 51ed998 | (same commit as #26) |
| 28 | 2026-04-24 | 0 | `docs/LUMEN_VISION.md` | 51ed998 | (same commit as #26) |
| 29 | 2026-04-24 | 0 | `docs/BUILD_LOG.md` | a193009 | docs(log): record VISION reconciliation in build log |
| 30 | 2026-04-24 | 0 | `docs/adr/005-validation-valibot.md` | 98df3a3 | docs(adr): ADR-005 validation Valibot over Zod/Arktype/TypeBox |
| 31 | 2026-04-24 | 0 | `docs/BUILD_LOG.md` | 501f7d3 | docs(log): record ADR-005 in build log |
| 32 | 2026-04-24 | 0 | `docs/adr/006-dynamic-pricing-from-database.md` | b05e389 | docs(adr): ADR-006 dynamic pricing from DB, Stripe is a processor |
| 33 | 2026-04-24 | 0 | `docs/BUILD_LOG.md` | 1bae465 | docs(log): record ADR-006 in build log |
| 34 | 2026-04-24 | 0 | `docs/adr/007-ui-primitives-bits-ui.md` | be700f1 | docs(adr): ADR-007 UI primitives Bits UI over shadcn/Skeleton/Melt/custom |
| 35 | 2026-04-24 | 0 | `docs/BUILD_LOG.md` | 8d8b47c | docs(log): record ADR-007 in build log |
| 36 | 2026-04-24 | 0 | `docs/adr/008-desktop-tauri-2.md` | b1658d2 | docs(adr): ADR-008 desktop Tauri 2 over Electron/Neutralino/native |
| 37 | 2026-04-24 | 0 | `docs/BUILD_LOG.md` | fc922af | docs(log): record ADR-008 in build log |
| 38 | 2026-04-24 | 0 | `docs/adr/009-package-manager-pnpm.md` | 18560ed | docs(adr): ADR-009 package manager pnpm exclusive over npm/yarn/bun |
| 39 | 2026-04-24 | 0 | `docs/BUILD_LOG.md` | b383edc | docs(log): record ADR-009 in build log |
| 40 | 2026-04-24 | 0 | `docs/adr/010-lint-format-biome.md` | d4cb7a8 | docs(adr): ADR-010 lint+format Biome over ESLint+Prettier |
| 41 | 2026-04-24 | 0 | `docs/BUILD_LOG.md` | 3e2b84a | docs(log): record ADR-010 in build log |
| 42 | 2026-04-24 | 0 | `docs/adr/README.md` | 7ff3737 | docs(adr): add ADR index README with all 10 Phase 0 ADRs |
| 43 | 2026-04-24 | 0 | `docs/BUILD_LOG.md` | 96c9367 | docs(log): record ADR README in build log |
| 44 | 2026-04-24 | 0 | `CHANGELOG.md` | 47f287e | docs(adr): close Phase 0 with CHANGELOG entry for ADRs 001-010 + reconciliation |
| 45 | 2026-04-24 | 0 | `docs/BUILD_LOG.md` | de11143 | docs(log): record Phase 0 CHANGELOG closure in build log |

---

## Phase 1 — Database Schema (In Progress)

| # | Date | Phase | File | Commit | Subject |
|---|---|---|---|---|---|
| 1 | 2026-04-24 | 1 | `package.json` | 3bfeffe | feat(scaffold): SvelteKit 2 + Svelte 5 + TypeScript strict baseline |
| 2 | 2026-04-24 | 1 | `pnpm-lock.yaml` | 3bfeffe | (same commit as #1) |
| 3 | 2026-04-24 | 1 | `tsconfig.json` | 3bfeffe | (same commit as #1) |
| 4 | 2026-04-24 | 1 | `svelte.config.js` | 3bfeffe | (same commit as #1) |
| 5 | 2026-04-24 | 1 | `vite.config.ts` | 3bfeffe | (same commit as #1) |
| 6 | 2026-04-24 | 1 | `playwright.config.ts` | 3bfeffe | (same commit as #1) |
| 7 | 2026-04-24 | 1 | `.npmrc` | 3bfeffe | (same commit as #1) |
| 8 | 2026-04-24 | 1 | `.prettierrc` | 3bfeffe | (same commit as #1) |
| 9 | 2026-04-24 | 1 | `.prettierignore` | 3bfeffe | (same commit as #1) |
| 10 | 2026-04-24 | 1 | `.vscode/extensions.json` | 3bfeffe | (same commit as #1) |
| 11 | 2026-04-24 | 1 | `src/app.html` | 3bfeffe | (same commit as #1) |
| 12 | 2026-04-24 | 1 | `src/app.d.ts` | 3bfeffe | (same commit as #1) |
| 13 | 2026-04-24 | 1 | `src/lib/index.ts` | 3bfeffe | (same commit as #1) |
| 14 | 2026-04-24 | 1 | `src/routes/+layout.svelte` | 3bfeffe | (same commit as #1) |
| 15 | 2026-04-24 | 1 | `src/routes/+page.svelte` | 3bfeffe | (same commit as #1) |
| 16 | 2026-04-24 | 1 | `static/favicon.svg` | 3bfeffe | (same commit as #1) |
| 17 | 2026-04-24 | 1 | `static/robots.txt` | 3bfeffe | (same commit as #1) |
| 18 | 2026-04-24 | 1 | `docs/BUILD_LOG.md` | c154aa5 | docs(log): open Phase 1 section and record SvelteKit scaffold |
| 19 | 2026-04-24 | 1 | `biome.json` | c38cc0e | feat(ci): add Biome 2 lint+format with PE7 strict rule set |
| 20 | 2026-04-24 | 1 | `package.json` | c38cc0e | (same commit as #19) |
| 21 | 2026-04-24 | 1 | `pnpm-lock.yaml` | c38cc0e | (same commit as #19) |
| 22 | 2026-04-24 | 1 | `.vscode/extensions.json` | c38cc0e | (same commit as #19) |
| 23 | 2026-04-24 | 1 | `playwright.config.ts` | c38cc0e | (same commit as #19) |
| 24 | 2026-04-24 | 1 | `src/app.d.ts` | c38cc0e | (same commit as #19) |
| 25 | 2026-04-24 | 1 | `svelte.config.js` | c38cc0e | (same commit as #19) |
| 26 | 2026-04-24 | 1 | `vite.config.ts` | c38cc0e | (same commit as #19) |
| 27 | 2026-04-24 | 1 | `docs/BUILD_LOG.md` | e299ce6 | docs(log): record Biome install in build log |
| 28 | 2026-04-24 | 1 | `lefthook.yml` | 603eb35 | build(ci): add lefthook with PE7 pre-commit and commit-msg hooks |
| 29 | 2026-04-24 | 1 | `package.json` | 603eb35 | (same commit as #28) |
| 30 | 2026-04-24 | 1 | `pnpm-lock.yaml` | 603eb35 | (same commit as #28) |
| 31 | 2026-04-24 | 1 | `docs/BUILD_LOG.md` | 0e7f959 | docs(log): record lefthook install in build log |
| 32 | 2026-04-24 | 1 | `commitlint.config.js` | a0bde1f | build(ci): add commitlint with Conventional Commits + Lumen scope set |
| 33 | 2026-04-24 | 1 | `package.json` | a0bde1f | (same commit as #32) |
| 34 | 2026-04-24 | 1 | `pnpm-lock.yaml` | a0bde1f | (same commit as #32) |
| 35 | 2026-04-24 | 1 | `docs/BUILD_LOG.md` | 11cccde | docs(log): record commitlint install in build log |
| 36 | 2026-04-24 | 1 | `.gitleaks.toml` | ffaa5c3 | build(ci): add gitleaks config and tolerant pre-commit hook |
| 37 | 2026-04-24 | 1 | `lefthook.yml` | ffaa5c3 | (same commit as #36) |
| 38 | 2026-04-24 | 1 | `docs/BUILD_LOG.md` | 139d1b7 | docs(log): record gitleaks config in build log |
| 39 | 2026-04-24 | 1 | `svelte.config.js` | 9351606 | build(deploy): swap adapter-auto for adapter-vercel |
| 40 | 2026-04-24 | 1 | `package.json` | 9351606 | (same commit as #39) |
| 41 | 2026-04-24 | 1 | `pnpm-lock.yaml` | 9351606 | (same commit as #39) |
| 42 | 2026-04-24 | 1 | `docs/BUILD_LOG.md` | 8ae2590 | docs(log): record Vercel adapter swap in build log |
| 43 | 2026-04-24 | 1 | `.mcp.json` | 61e850a | build(ci): add Svelte MCP server and Lumen-augmented CLAUDE.md |
| 44 | 2026-04-24 | 1 | `CLAUDE.md` | 61e850a | (same commit as #43) |
| 45 | 2026-04-24 | 1 | `commitlint.config.js` | 9107c72 | style(ci): format commitlint.config.js per Biome line-width |
| 46 | 2026-04-24 | 1 | `docs/BUILD_LOG.md` | cd9f4eb | docs(log): record MCP install + commitlint format fix |
| 47 | 2026-04-24 | 1 | `package.json` | 8fe14d6 | build(db): install Drizzle ORM, drizzle-kit, and Neon serverless driver |
| 48 | 2026-04-24 | 1 | `pnpm-lock.yaml` | 8fe14d6 | (same commit as #47) |
| 49 | 2026-04-24 | 1 | `docs/BUILD_LOG.md` | 1153613 | docs(log): record Drizzle install in build log |
| 50 | 2026-04-24 | 1 | `drizzle.config.ts` | d96c337 | build(db): add drizzle.config.ts pointing schema dir to src/lib/server/db/schema |
| 51 | 2026-04-24 | 1 | `docs/BUILD_LOG.md` | 3a1b00f | docs(log): record drizzle.config in build log |
| 52 | 2026-04-24 | 1 | `src/lib/server/db/schema/_columns.ts` | 0adec25 | feat(schema): author Drizzle schema for 31 tables across 8 domains |
| 53 | 2026-04-24 | 1 | `src/lib/server/db/schema/auth.ts` | 0adec25 | (same commit as #52) |
| 54 | 2026-04-24 | 1 | `src/lib/server/db/schema/organizations.ts` | 0adec25 | (same commit as #52) |
| 55 | 2026-04-24 | 1 | `src/lib/server/db/schema/rbac.ts` | 0adec25 | (same commit as #52) |
| 56 | 2026-04-24 | 1 | `src/lib/server/db/schema/nodes.ts` | 0adec25 | (same commit as #52) |
| 57 | 2026-04-24 | 1 | `src/lib/server/db/schema/links.ts` | 0adec25 | (same commit as #52) |
| 58 | 2026-04-24 | 1 | `src/lib/server/db/schema/tags.ts` | 0adec25 | (same commit as #52) |
| 59 | 2026-04-24 | 1 | `src/lib/server/db/schema/decisions.ts` | 0adec25 | (same commit as #52) |
| 60 | 2026-04-24 | 1 | `src/lib/server/db/schema/snippets.ts` | 0adec25 | (same commit as #52) |
| 61 | 2026-04-24 | 1 | `src/lib/server/db/schema/dailies.ts` | 0adec25 | (same commit as #52) |
| 62 | 2026-04-24 | 1 | `src/lib/server/db/schema/publications.ts` | 0adec25 | (same commit as #52) |
| 63 | 2026-04-24 | 1 | `src/lib/server/db/schema/inbox.ts` | 0adec25 | (same commit as #52) |
| 64 | 2026-04-24 | 1 | `src/lib/server/db/schema/ai.ts` | 0adec25 | (same commit as #52) |
| 65 | 2026-04-24 | 1 | `src/lib/server/db/schema/billing.ts` | 0adec25 | (same commit as #52) |
| 66 | 2026-04-24 | 1 | `src/lib/server/db/schema/audit.ts` | 0adec25 | (same commit as #52) |
| 67 | 2026-04-24 | 1 | `src/lib/server/db/schema/webhooks.ts` | 0adec25 | (same commit as #52) |
| 68 | 2026-04-24 | 1 | `src/lib/server/db/schema/index.ts` | 0adec25 | (same commit as #52) |
| 69 | 2026-04-24 | 1 | `docs/BUILD_LOG.md` | 736bde2 | docs(log): record full Drizzle schema in build log |
| 70 | 2026-04-24 | 1 | `drizzle/0000_initial_schema.sql` | 5a7264d | feat(schema): generate initial_schema migration for 31-table baseline |
| 71 | 2026-04-24 | 1 | `drizzle/meta/0000_snapshot.json` | 5a7264d | (same commit as #70) |
| 72 | 2026-04-24 | 1 | `drizzle/meta/_journal.json` | 5a7264d | (same commit as #70) |
| 73 | 2026-04-24 | 1 | `docs/BUILD_LOG.md` | _this commit_ | docs(log): record initial migration in build log |

---

## Milestone Tags

| Tag | Date | Phase | Commit | Description |
|---|---|---|---|---|
| v0.1.0 | 2026-04-24 | 0 | 9c8e992 | Phase 0: Foundation baseline — docs only, no code yet |

---

## Append Instructions

After every `git commit` that creates or modifies a file, append a new row to the appropriate phase section. Do NOT batch multiple commits into one log entry — one row per file per commit. If a single commit introduces multiple files (e.g. the three issue template files), log each file as its own row and note which rows share the same commit.

When a phase closes, add a new phase heading for the next phase. Update the Milestone Tags table with the new release tag.

This log is the project's memory. Keep it honest.
