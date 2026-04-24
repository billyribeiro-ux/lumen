# Lumen Architecture Decision Records

> **Format:** Nygard ADR. See [`000-template.md`](./000-template.md).
> **Discipline:** ADRs are immutable once accepted. To change a decision, write a new ADR that supersedes the old one.

This directory captures every architectural decision in Lumen with non-trivial consequences. If you are building, debugging, or extending Lumen, read the relevant ADR before changing the layer it covers — the rationale lives here, not in commit messages.

---

## Index

| ADR | Title | Status | Phase | Date |
|---|---|---|---|---|
| [000](./000-template.md) | Template | Meta | — | 2026-04-24 |
| [001](./001-meta-framework-sveltekit.md) | Meta-framework — SvelteKit 2 over Next, Nuxt, and Remix | ✅ Accepted | 0 | 2026-04-24 |
| [002](./002-database-neon-postgres.md) | Database — Neon Postgres over PlanetScale, Supabase, D1, self-hosted | ✅ Accepted | 0 | 2026-04-24 |
| [003](./003-orm-drizzle.md) | ORM — Drizzle over Prisma, Kysely, raw SQL, TypeORM | ✅ Accepted | 0 | 2026-04-24 |
| [004](./004-authentication-better-auth.md) | Authentication — Better Auth over Lucia, Auth.js, Clerk | ✅ Accepted | 0 | 2026-04-24 |
| [005](./005-validation-valibot.md) | Validation — Valibot over Zod, Arktype, TypeBox, Yup | ✅ Accepted | 0 | 2026-04-24 |
| [006](./006-dynamic-pricing-from-database.md) | Dynamic pricing from the database, not the Stripe dashboard | ✅ Accepted | 0 | 2026-04-24 |
| [007](./007-ui-primitives-bits-ui.md) | UI primitives — Bits UI over shadcn-svelte, Skeleton, raw Melt, custom | ✅ Accepted | 0 | 2026-04-24 |
| [008](./008-desktop-tauri-2.md) | Desktop — Tauri 2 over Electron, Neutralino, native | ✅ Accepted | 0 | 2026-04-24 |
| [009](./009-package-manager-pnpm.md) | Package manager — pnpm exclusive over npm, yarn, bun | ✅ Accepted | 0 | 2026-04-24 |
| [010](./010-lint-format-biome.md) | Lint + format — Biome over ESLint + Prettier | ✅ Accepted | 0 | 2026-04-24 |

---

## How to Read This Index

- ✅ **Accepted** — the decision is in force. New code must comply.
- 🚧 **Proposed** — the decision is being deliberated. Do not act on it yet.
- ⚠️ **Deprecated** — the decision is no longer recommended but is not yet superseded.
- 🪦 **Superseded by ADR-XXX** — the decision is replaced; see the linked ADR.

---

## When to Write an ADR

Write an ADR when the decision:

- Affects the shape of the system (not just a local implementation choice).
- Has trade-offs worth remembering.
- Constrains future decisions (e.g. picking an ORM constrains future query patterns).
- Costs significant effort to reverse.

Skip an ADR for:

- Local refactors and bug fixes without architectural implications.
- Dependency patch-level upgrades.
- UI copy changes.
- Anything already covered by an existing ADR (instead, supersede the existing one).

---

## How to Write an ADR

1. Copy [`000-template.md`](./000-template.md) to `NNN-short-kebab-title.md` where `NNN` is the next available three-digit number.
2. Fill in every section. Don't skip *Alternatives Considered* — if you can't think of two real alternatives plus "do nothing," you haven't thought about the decision deeply enough.
3. Open a PR labeled `adr`. ADRs are accepted via PR review.
4. Once merged, the ADR is **immutable**. Don't edit it. To change the decision, write a new ADR that supersedes it.
5. Update this `README.md` index in the same PR.

---

## Living Documents vs Frozen Decisions

ADRs are frozen. They capture *why a decision was made at a moment in time*. They go stale, and that's fine — staleness is the data.

The companion living documents are:

- **`ARCHITECTURE.md`** — the current, accurate description of how the system works. Updated at the end of every phase.
- **`ROADMAP.md`** — the current, accurate description of what's coming. Updated at the end of every phase.
- **`docs/LUMEN_VISION.md`** — the product source of truth. Updated only when product direction changes.
- **`CHANGELOG.md`** — the version-anchored record of what shipped.
- **`docs/BUILD_LOG.md`** — the per-commit chronological build trail.

When ARCHITECTURE.md disagrees with an ADR, the ADR wins for the question "why is it this way?" and ARCHITECTURE.md wins for the question "what shape is it now?". Both are correct.

---

## Phase 0 Foundation Set (Complete)

All ten foundation ADRs are accepted as of 2026-04-24. Together they lock in:

- **Framework:** SvelteKit 2 + Svelte 5 (runes-only).
- **Data layer:** Neon Postgres + Drizzle ORM.
- **Auth:** Better Auth (passkeys + 2FA + OAuth + magic links).
- **Validation:** Valibot.
- **Billing:** Dynamic pricing — DB is source of truth, Stripe is processor.
- **UI:** Bits UI primitives + PE7 CSS (zero Tailwind).
- **Desktop:** Tauri 2.
- **Package manager:** pnpm.
- **Lint + format:** Biome.

Phase 1 (Database Schema) begins next.
