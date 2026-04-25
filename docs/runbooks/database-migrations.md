# Runbook — Database Migrations

> **Owner:** Database layer (ADR-002 + ADR-003)
> **Audience:** Any engineer touching `src/lib/server/db/schema/**` or `drizzle/**`.
> **Rule of thumb:** Migrations are forever. Every one ships as a reviewable SQL file in `drizzle/`.

---

## When to author a migration

Author a migration when any of these changes:

- A new `pgTable`, `pgEnum`, or `check` constraint in `src/lib/server/db/schema/`.
- A new column, an index, a default value, or a foreign-key relationship on an existing table.
- A rename (see the **Zero-downtime rule** below — renames are two-step).
- A drop of any column, table, or enum value (also two-step).

---

## The four commands

```bash
pnpm db:generate      # diff schema → new migration SQL
pnpm db:check         # validate migrations against schema snapshot
pnpm db:migrate       # apply pending migrations to DATABASE_URL
pnpm db:studio        # local web GUI for inspection
pnpm db:push          # dev-only direct push (NEVER in production)
```

`db:generate` is the only one you need for most day-to-day work.
`db:migrate` runs in CI and on deploy. `db:push` is the short path we
use against per-developer Neon branches during prototyping — it skips
the migration file entirely and pushes the schema diff directly.
Never `db:push` against staging or production.

---

## Adding a migration — happy path

1. Edit `src/lib/server/db/schema/<file>.ts`.
2. Run `pnpm db:generate --name=<short-snake-name>`.
3. Review the generated `drizzle/NNNN_<name>.sql`.
   - Does every expected `CREATE TABLE` / `ALTER TABLE` / `CREATE INDEX` appear?
   - Are there any surprise drops? (If yes, you changed a column Drizzle mis-read.)
   - Are any columns newly `NOT NULL` without a default? (That breaks any existing rows.)
4. Run `pnpm db:check` — validates the generated file against the snapshot.
5. Commit schema file + migration file + `drizzle/meta/**` snapshot changes **together**.
6. Open a PR. CI runs `pnpm db:migrate` against a per-PR Neon branch as a smoke test (Phase 14 wires this).
7. Merge. Production deploy runs `pnpm db:migrate` on release.

---

## The zero-downtime rule

> **Every migration must be forward-compatible for one version.**
> A migration that drops, renames, or changes the type of an existing column must ship in two steps across two releases.

### Rename: `nodes.title` → `nodes.heading`

**Release N (expansion):**
1. Add `heading` column, nullable, with a trigger that copies `title` → `heading` on insert / update.
2. Application code dual-writes: writes to both columns; reads from `title` still.
3. Backfill: `UPDATE nodes SET heading = title WHERE heading IS NULL;`

**Release N+1 (contraction):**
1. Application code reads from `heading` and stops writing to `title`.
2. Drop `title`.

Skipping the expansion step causes a window where the old code (still running) writes to a dropped column, and requests fail at the database layer. This is the defining bug of amateur migrations. Don't ship it.

### Drop a column

Same pattern: stop writing to the column in release N, drop it in release N+1.

### Change a column type

Same pattern: add the new column, dual-write, backfill, cut over reads, drop the old column.

### Drop a `NOT NULL` enum value

Same pattern: stop writing that value, backfill existing rows away from it, then alter the enum in a separate release.

### Add a `NOT NULL` column to an existing table

1. Release N: add the column as nullable with a default. Application backfills via write path.
2. Release N+1 (optional): once all rows have a value, add `NOT NULL` and drop the default if desired.

---

## Rolling back

Drizzle does not ship a "down migration" story — intentionally, because
down migrations are often impossible (data you dropped is gone). Lumen's
rollback strategy is **forward-only**:

- If a migration breaks production and the code was fine before it, deploy the previous build via Vercel's one-click rollback. The database continues to have the new columns / tables, which the previous build simply ignores.
- If the migration itself corrupted data, restore from Neon's point-in-time recovery (7-day window on production branches) or branch an older snapshot and `pg_dump` the affected tables forward.

The corollary: **never ship a migration that makes the new schema unreadable by the previous build.** The zero-downtime rule above guarantees this.

---

## Working in preview branches

Every PR gets its own Neon branch via the Vercel + Neon integration. The
branch's `DATABASE_URL` is injected into the preview deployment. `pnpm
db:migrate` runs automatically on PR open.

If you need to iterate locally without opening a PR, create a branch by
hand:

```bash
# Via Neon CLI (install: brew install neonctl)
neonctl branches create --name="dev-$(whoami)"
neonctl connection-string dev-$(whoami)
# Paste the URL into your local .env as DATABASE_URL, then:
pnpm db:push     # fast dev iteration, skips migration files
# When the schema is settled:
pnpm db:generate --name=<name>
pnpm db:migrate
```

Never commit a schema change that has only been validated via `db:push`.
The migration file is the source of truth for production.

---

## Editing a migration by hand

Sometimes Drizzle's generator doesn't express what we need — the canonical
example is a `tsvector` generated column on `node_content`, or a
`pg_trgm` GIN index on `tags.name`. Those land as **hand-edited additions**
to the generated SQL:

1. Run `pnpm db:generate` to get the Drizzle-produced diff.
2. Append your custom SQL **below** the generated statements, with a
   `-- statement-breakpoint` marker between every statement.
3. Run `pnpm db:check` to confirm the snapshot still matches.
4. Commit.

Do **not** edit the snapshot JSON directly. It's Drizzle's memory; corrupting
it means every future `db:generate` produces a wrong diff.

---

## Seed data

Seeding is a Phase 2 concern and is covered by `docs/runbooks/database-seeding.md`
(to be written in Phase 2). Seeds are never part of a migration — they run
via a separate `pnpm db:seed` script and are scoped to non-production
environments.

---

## Emergency procedures

### Migration deployed and broken

1. **Do not `DROP` anything to "fix" it.** That compounds the blast radius.
2. Roll the application back to the previous build on Vercel (one click).
3. Observe: with the old code + new schema, the system should be stable.
4. Author a forward fix. Ship it through the normal migration pipeline. Repeat if needed.

### Drift detected between schema and production

`pnpm db:check` reports a mismatch. Possible causes:
- A developer manually edited the database via the Neon console (forbidden, but possible).
- A migration was lost in a bad rebase or force-push.

Resolution:
1. Take a snapshot of production via Neon's branching feature.
2. Branch a dev environment off the snapshot.
3. Run `pnpm db:generate --name=reconcile_drift` — the diff is the difference between production and your schema.
4. Review the diff. Either:
   - **The schema is correct**, the DB drifted — roll that migration forward to production.
   - **The DB is correct**, the schema drifted — amend your schema files to match.

Never resolve drift by editing the snapshot JSON.

---

## Related

- ADR-002 — Database: Neon Postgres.
- ADR-003 — ORM: Drizzle.
- `ARCHITECTURE.md` §4 — Core data model.
- `ARCHITECTURE.md` §11.4 — Zero-downtime migration policy.
- `drizzle.config.ts` — Drizzle Kit configuration.
