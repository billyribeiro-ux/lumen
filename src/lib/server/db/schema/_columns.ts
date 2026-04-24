// Lumen schema — shared column helpers (ADR-003 implementation notes).
//
// Patterns enforced here:
// - UUID v7 primary keys with defaultRandom (Drizzle uses gen_random_uuid()).
// - timestamptz throughout, with sane defaults.
// - Soft-delete on user-facing resources via deletedAt.
// - organization_id is the multi-tenant scope on every user-scoped resource.

import { sql } from 'drizzle-orm';
import { timestamp, uuid } from 'drizzle-orm/pg-core';

/** Primary-key id column. UUID v4 from Postgres' built-in `gen_random_uuid()`. */
export const idColumn = () => uuid('id').primaryKey().defaultRandom();

/** `created_at` — set on insert, never updated. */
export const createdAt = () =>
  timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow();

/** `updated_at` — updated on every write. The trigger to bump this lives in a migration. */
export const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow();

/** Soft-delete marker. `null` = live row; non-null = deleted at that time. */
export const deletedAt = () => timestamp('deleted_at', { withTimezone: true, mode: 'date' });

/**
 * Common timestamp triplet for user-facing resources that support soft delete.
 * Spread into a `pgTable` definition: `...timestamps()`.
 */
export const timestamps = () => ({
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: deletedAt(),
});

/**
 * Common timestamp pair for non-soft-deletable rows (auth, billing, audit log,
 * webhook events). No `deleted_at` — these are append-only or hard-delete only.
 */
export const auditTimestamps = () => ({
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** SQL expression for the current timestamp at the database level. */
export const nowSql = sql`now()`;
