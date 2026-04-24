# ADR-002: Database — Neon Postgres over PlanetScale, Supabase, Cloudflare D1, and self-hosted Postgres

**Status:** Accepted
**Date:** 2026-04-24
**Deciders:** @billyribeiro-ux
**Phase:** 0 — Foundation
**Tags:** `database`, `infrastructure`, `data`, `foundation`

---

## Context

Lumen is a server-authoritative knowledge graph. Every Node, Link, version, audit row, and billing record lives in a single primary store. The store must:

- Speak Postgres dialect — Lumen's data model leans on `tsvector` full-text search, JSONB metadata, foreign keys, generated columns, partial indexes, and array types. Anything sub-Postgres is a non-starter.
- Be **edge-compatible** so SvelteKit handlers running in Vercel's edge / fluid compute environment can talk to the database without a TCP socket.
- Provide **per-PR isolated branches** so preview deployments can run against production-shape data without polluting any shared environment.
- **Autosuspend when idle** so Lumen can run preview branches and dev databases for free or near-free during early development.
- Have a stable team, transparent pricing, and a credible 5-year roadmap. Database lock-in is the most expensive lock-in there is.

Four realistic candidates were evaluated: Neon Postgres, Supabase Postgres, Cloudflare D1 (SQLite), and self-hosted Postgres on Fly.io / Railway / DigitalOcean. PlanetScale was disqualified up front (MySQL only; foreign keys reintroduced in 2024 are functional but the dialect mismatch with Lumen's tsvector-heavy queries makes it the wrong tool).

---

## Decision

**We will use Neon Postgres as Lumen's primary data store**, accessed via `@neondatabase/serverless` 1.0.x and Drizzle ORM 0.44.x. All persistent application data lives here: nodes, links, content, versions, auth tables, billing tables, audit log, webhook events.

Operational shape:

- One Neon **project** per deployment environment (production, staging) plus an organization-wide **dev project** that hosts per-developer branches and per-PR preview branches.
- Production runs on a dedicated branch (`main`) with autoscaling compute and a 7-day point-in-time recovery window.
- Every pull request triggers a Neon branch creation hook; the branch URL is injected into the Vercel preview deployment as `DATABASE_URL`. Branches are destroyed on PR close.
- The serverless HTTP driver is the default. The WebSocket driver is reserved for transactions and listen/notify; both ship from the same package.
- Drizzle owns all schema definitions and migrations. Neon's web console is read-only in our workflow — no schema lives outside the repo.

---

## Consequences

### Positive

- **Postgres without ops.** Backups, patching, replication, and failover are managed. We invest engineering hours in product, not in pgbouncer tuning.
- **Branching is the killer feature.** Every PR gets a copy-on-write database branch in milliseconds. Migrations are validated against production-shape data on every PR before they touch production.
- **Autosuspend economics.** Compute scales to zero when idle. Dev branches and preview branches cost cents per month combined, not dollars per branch per month.
- **Edge-native driver.** `@neondatabase/serverless` speaks Neon's HTTP and WebSocket protocols; Vercel edge functions and SvelteKit edge handlers connect without a TCP socket. Cold-start latency is sub-100ms.
- **Standard Postgres dialect.** Anything we know about Postgres works. `tsvector`, `pg_trgm`, JSONB operators, generated columns, partial indexes, materialized views — all available. No vendor-specific replacements to learn.
- **Drizzle integration is first-class.** The Drizzle Neon adapter is maintained by both projects and exercised heavily in production by other Drizzle users.

### Negative

- **Vendor concentration risk.** Neon's data is portable (it's just Postgres `pg_dump`), but the *control plane* — branching, autoscaling, autosuspend, project orchestration — is not. If Neon's economics change, migrating to a managed Postgres elsewhere is operationally non-trivial even though the data itself is.
- **Cold-start latency on autosuspended branches.** A branch that has been idle for 5+ minutes incurs ~500ms wake-up on the first query. This is acceptable for dev / preview branches; production runs always-on.
- **WebSocket driver is required for transactions.** The HTTP driver does not support multi-statement transactions. Code paths that need transactional writes import a separate driver instance — a minor but real DX papercut.
- **Connection limits per branch are bounded.** Free tier is 10 simultaneous connections; the paid plan we'll move to before launch raises this materially. Pooling via the serverless driver mitigates but does not eliminate this concern.

### Neutral

- Neon was acquired by Databricks in 2025. Acquisition-driven roadmap shifts are possible. Mitigation is the portability of Postgres itself — `pg_dump` is the escape hatch.
- Read replicas are available but not used in v1. Adding them later does not require schema or driver changes.

---

## Alternatives Considered

### Alternative 1: Supabase Postgres

**Pros:**
- Postgres dialect, same as Neon.
- Integrated auth, storage, realtime, and edge functions reduce per-vendor surface area.
- Mature dashboard and active community.
- Branching shipped to GA in 2024.

**Cons:**
- Branching is built on Postgres physical replication, not copy-on-write — branch creation is materially slower (seconds to tens of seconds for a non-trivial dataset), branch storage is full copies, and branches cost real money each.
- The bundled platform is a feature, not a benefit, here. We've already chosen Better Auth (ADR-004), Resend (email), and Vercel (compute). Supabase's auth and edge functions would be unused, and the parts we'd actually use (the database) are exactly what Neon does better.
- The serverless driver story is weaker. `postgres` over WebSocket works but is not as mature as Neon's first-party HTTP transport.
- Connection pooling via Supavisor is solid but adds a hop relative to Neon's in-driver pooling.

**Why rejected:** Supabase is great when you adopt the whole platform. We're cherry-picking the database. Neon's branching, autosuspend, and edge driver are decisively better for that single concern.

### Alternative 2: Cloudflare D1 (SQLite)

**Pros:**
- Cheapest possible storage and compute on the table.
- SQLite is fast, well-understood, and embedded.
- Cloudflare's edge runtime makes the database physically close to handlers.
- Excellent for read-heavy workloads with simple schemas.

**Cons:**
- It is **SQLite**, not Postgres. No `tsvector` (FTS5 exists but is materially less powerful), no JSONB operators, no generated columns at parity, no partial indexes at parity, no array types, no enum types, no `pg_trgm` for fuzzy tag search.
- Replication model is read-replica-with-eventual-consistency. Lumen's audit log and version-counter writes need stronger guarantees than D1's primary-write model gives by default.
- Not a Postgres dialect — Drizzle works, but every query and migration must be rewritten if we ever leave D1 for Postgres elsewhere.
- Limits: 10 GB per database, 50,000 reads / 1,000 writes per second per database. Crossable on the writes axis once the audit log grows.

**Why rejected:** Lumen's data model is Postgres-shaped end-to-end. Choosing SQLite would require redesigning the search and graph traversal layers around what D1 can do, not what the product needs.

### Alternative 3: Self-hosted Postgres (Fly.io, Railway, DigitalOcean Managed)

**Pros:**
- Full control. Any extension. Any version. Any tuning.
- No vendor lock-in beyond "it's Postgres on a Linux box."
- Predictable pricing at any scale.

**Cons:**
- We become the DBA. Backups, upgrades, replication, failover, monitoring, vacuum tuning — all our responsibility.
- No copy-on-write branching. Achieving Neon-equivalent preview environments requires building the branching infrastructure ourselves on top of `pg_basebackup` or filesystem snapshots — a significant project on its own.
- Cold-start economics are worse. A 24/7 minimum compute charge applies even when nobody is using the dev environment.
- Solo-engineer ops budget is zero. Every minute spent on database operations is a minute not shipping product.

**Why rejected:** Lumen is the product. A managed-Postgres-with-branching is not. Self-hosting moves work in the wrong direction at this stage of the company.

### Alternative 4: Do nothing (defer the choice)

**Pros:**
- Zero commitment until we know more.

**Cons:**
- The ORM choice (ADR-003), the auth choice (ADR-004), and the migration tooling all depend on the database choice. Deferring this blocks the entire downstream chain.
- Neon's free tier means the cost of choosing now is functionally zero.

**Why rejected:** This is a foundation phase decision. Foundation phase decisions are not deferrable.

---

## Implementation Notes

- `DATABASE_URL` is the only variable required for the driver. It points to the `pooler` endpoint in production for connection pooling and to the direct branch endpoint in development.
- Drizzle migrations run via `pnpm db:migrate` against the configured `DATABASE_URL`. CI runs migrations against an ephemeral preview branch as a smoke test.
- Schema-only operations (`drizzle-kit generate`, `drizzle-kit push`) do not require a live database connection — generation works against the TypeScript schema files alone. This is exploited during the Phase 1 scaffold so initial schema authoring can proceed before any Neon project exists.
- Neon's point-in-time recovery is enabled at 7 days for production. Dev / preview branches inherit the 1-day default.
- The Neon Vercel integration handles `DATABASE_URL` injection per environment. The repo never holds a real connection string; only `.env.example` documents the variable name.
- A dedicated runbook (`docs/runbooks/database-migrations.md`) is written in Phase 1 covering: migration authoring, the zero-downtime rule, rollback procedure, and how to recover from a failed deploy.

---

## References

- [Neon documentation](https://neon.tech/docs)
- [Neon serverless driver](https://github.com/neondatabase/serverless)
- [Drizzle Neon adapter](https://orm.drizzle.team/docs/get-started-postgresql#neon)
- [Neon branching architecture](https://neon.tech/docs/introduction/branching)
- Related: [ADR-003: ORM — Drizzle](./003-orm-drizzle.md)
- Related: [ADR-006: Dynamic pricing from the database](./006-dynamic-pricing-from-database.md)

---

## Review & Revision History

| Date | Author | Change |
|---|---|---|
| 2026-04-24 | @billyribeiro-ux | Initial draft — accepted |
