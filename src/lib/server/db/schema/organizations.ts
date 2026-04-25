// Organizations schema — top-level tenancy (ARCHITECTURE.md §4.8).
//
// Every user-scoped resource rolls up to an organization. Users join
// organizations via memberships; pending invites live in invitations.

import { sql } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { auditTimestamps, idColumn, timestamps } from './_columns';
import { users } from './auth';

export const organizations = pgTable(
  'organizations',
  {
    id: idColumn(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    // Owner is the original creator; org RBAC determines actual permissions.
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex('organizations_slug_unique').on(table.slug),
    index('organizations_owner_id_idx').on(table.ownerId),
  ],
);

export const memberships = pgTable(
  'memberships',
  {
    id: idColumn(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    // Role at the organization level: owner, admin, editor, viewer.
    // Validated at the application layer via the rbac.roles enum.
    role: text('role').notNull().default('viewer'),
    invitedBy: uuid('invited_by').references(() => users.id, { onDelete: 'set null' }),
    joinedAt: timestamp('joined_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    ...auditTimestamps(),
  },
  (table) => [
    uniqueIndex('memberships_user_org_unique').on(table.userId, table.organizationId),
    index('memberships_org_idx').on(table.organizationId),
    index('memberships_user_idx').on(table.userId),
  ],
);

export const invitations = pgTable(
  'invitations',
  {
    id: idColumn(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role').notNull().default('viewer'),
    token: text('token').notNull(),
    invitedBy: uuid('invited_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now() + interval '7 days'`),
    acceptedAt: timestamp('accepted_at', { withTimezone: true, mode: 'date' }),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'date' }),
    ...auditTimestamps(),
  },
  (table) => [
    uniqueIndex('invitations_token_unique').on(table.token),
    uniqueIndex('invitations_org_email_unique').on(table.organizationId, table.email),
    index('invitations_expires_at_idx').on(table.expiresAt),
  ],
);
