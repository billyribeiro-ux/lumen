// Audit log — append-only record of every mutating action (ARCHITECTURE.md §4.10).
//
// One row per mutation: who (actor_id), what (action + resource), when
// (created_at), before-state and after-state (JSONB). Never updated
// after insert; hard-deleted only via a scheduled retention job.

import { sql } from 'drizzle-orm';
import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { idColumn } from './_columns';
import { users } from './auth';
import { organizations } from './organizations';

export const auditLog = pgTable(
  'audit_log',
  {
    id: idColumn(),
    organizationId: uuid('organization_id').references(() => organizations.id, {
      onDelete: 'set null',
    }),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    // Machine-readable event key: 'node.update', 'billing.subscription.change', etc.
    action: text('action').notNull(),
    // Resource affected, in URN-ish notation: 'node:<uuid>', 'subscription:<uuid>'.
    resource: text('resource').notNull(),
    // Optional request identifier for cross-log correlation.
    requestId: text('request_id'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    beforeState: jsonb('before_state').notNull().default(sql`'null'::jsonb`),
    afterState: jsonb('after_state').notNull().default(sql`'null'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('audit_log_org_created_idx').on(table.organizationId, table.createdAt),
    index('audit_log_actor_idx').on(table.actorId),
    index('audit_log_action_idx').on(table.action),
    index('audit_log_resource_idx').on(table.resource),
  ],
);
