# Runbook — Database Seeding

> **Owner:** Database layer (Phase 2 / ADR-002 + ADR-003)
> **Audience:** Anyone running the app locally or against a Neon preview branch.
> **Rule of thumb:** Seeds are deterministic, idempotent, and forbidden in production.

---

## What seeding gives you

A clean, dev-ready Lumen database with:

- **3 organizations** — Lumen Labs (studio), Indie Studio (pro), Free Hacker (free).
- **15 users** across owner / admin / editor / viewer roles, plus 5 trial users with their own one-person workspaces and 30-day Pro trials.
- All credentialed users share the password **`LumenDev2026!`** (Argon2id-hashed at seed time, OWASP 2024 parameters).
- **4 RBAC roles + 16 permission keys** wired into the default role-permission matrix.
- **3 products + 4 prices** (free, pro/monthly, pro/annual, studio/monthly, studio/annual). Stripe IDs are null — `pnpm stripe:sync` (Phase 8) populates them later.
- **~15 sample nodes** across all 9 node types: notes, tasks, decisions, specs, snippets, projects, daily notes, plus inbox items and inter-node links.
- **11 organization-scoped tags**.
- **Daily notes** for each org owner over the past 3 days.
- **Inbox items** to exercise capture flows.
- **Tier-correct entitlements** for every user.

The seed runs in dependency order: RBAC → billing catalog → users/orgs/memberships/accounts/entitlements → content.

---

## Running the seed

The seed is gated by three independent guards (see `scripts/seed/guard.ts`):

1. `DATABASE_URL` must be set.
2. `NODE_ENV` must NOT be `production`.
3. `ALLOW_DESTRUCTIVE_DB_OPS` must equal `"true"`.
4. `DATABASE_URL` hostname must NOT match a known production-host substring (`lumen-prod`, `production`, `prod-pooler`).

Any one failure aborts before touching the database.

### Initial seed (clean DB)

```bash
# 1. Apply migrations to your dev branch
pnpm db:migrate

# 2. Seed
ALLOW_DESTRUCTIVE_DB_OPS=true pnpm db:seed
```

### Re-seed (preserves nothing — wipes first)

```bash
ALLOW_DESTRUCTIVE_DB_OPS=true pnpm db:reset
```

`db:reset` runs `db:wipe` then `db:seed`. The wipe `TRUNCATE`s every Lumen table in FK-safe order under a single transaction. Schema (DDL) is not touched.

### Wipe only (no re-seed)

```bash
ALLOW_DESTRUCTIVE_DB_OPS=true pnpm db:wipe
```

---

## Idempotency

The seed is safe to run multiple times. Every insert is preceded by an existence check; subsequent runs are no-ops on already-present rows. This means:

- Adding a new persona to `personas.ts` and re-running the seed inserts only the new user.
- Adding a new permission to `runners/rbac.ts` inserts only the new permission and updates role mappings.
- Re-running with the same fixtures produces the same final state.

If you need to re-create everything from scratch (e.g. you deleted a user manually and want them back), use `db:reset` instead — `db:seed` won't restore deleted rows because it sees the tombstones and skips.

---

## What's NOT seeded

These are deliberately deferred to later phases:

- **Stripe customer IDs / subscription IDs / invoices.** Created when Phase 9 wires webhook-driven billing state.
- **Sessions / verification tokens.** Created at sign-in time by Better Auth (Phase 3).
- **OAuth account rows.** Created when a user signs in via Google or GitHub (Phase 3).
- **Audit log entries.** Populated by mutation handlers (Phase 5+).
- **Webhook events.** Populated by webhook receivers (Phase 7+).
- **Publications.** Created when Phase 18 wires `⌘⇧P`.
- **AI conversations / messages.** Created when Phase 16 wires the co-pilot.

---

## Adding new seed data

### A new persona

1. Add a `UserFixture` to `USERS` in `scripts/seed/personas.ts`.
2. If they belong to a new org, add an `OrgFixture` to `ORGANIZATIONS` (or to the trial set if they're a solo trial user).
3. Re-run `pnpm db:seed` — only the new rows are inserted.

### A new node

1. Add a `NodeSeed` to `NODES_BY_OWNER_EMAIL` in `scripts/seed/runners/content.ts` under the appropriate owner's email.
2. Re-run `pnpm db:seed`.

If the node type is `decision` or `snippet`, the seed automatically populates the satellite table (`decisions` / `snippets`) using fields from the node's body and metadata.

### A new role or permission

1. Add to `ROLE_DEFINITIONS` or `PERMISSION_DEFINITIONS` in `scripts/seed/runners/rbac.ts`.
2. Update `ROLE_PERMISSION_MATRIX` to grant the new permission to the appropriate roles.
3. Re-run.

### A new tier or price

1. Add to `PRODUCTS` or `PRICES` in `scripts/seed/runners/billing.ts`.
2. Re-run. Stripe IDs will be filled in by `pnpm stripe:sync` later.

---

## Seeding against a Neon preview branch

The Vercel + Neon integration provisions a fresh Neon branch per PR and exposes its `DATABASE_URL` to the preview deployment. To seed it locally:

```bash
# Get the preview branch URL
neonctl branches get --name <branch-name>

# Export it
export DATABASE_URL=<the-pooler-url>

# Apply migrations and seed
pnpm db:migrate
ALLOW_DESTRUCTIVE_DB_OPS=true pnpm db:seed
```

Preview branches are destroyed when the PR closes, so seed pollution is bounded.

---

## Production safety

The seed scripts will not run against any of these signals:

- Hostnames containing `lumen-prod`, `production`, or `prod-pooler`.
- `NODE_ENV=production`.
- A missing or empty `ALLOW_DESTRUCTIVE_DB_OPS` flag.

This is **defense in depth**, not defense in singularity. If you genuinely need to seed a prod-shaped DB for testing (e.g. load testing), branch production via `neonctl branches create --parent main --name <test>` and seed against the branch.

If you find a production hostname pattern that doesn't match the existing hints, **add it to `PRODUCTION_HOST_HINTS` in `scripts/seed/guard.ts` immediately** — the cost of a false positive is one extra check; the cost of a false negative is irrecoverable.

---

## Related

- ADR-002 — Database: Neon Postgres.
- ADR-003 — ORM: Drizzle.
- ADR-004 — Authentication: Better Auth (consumes the seeded user/account rows in Phase 3).
- ADR-006 — Dynamic pricing from the database (foundation for the billing catalog seed).
- `docs/runbooks/database-migrations.md` — sibling runbook for schema migrations.
