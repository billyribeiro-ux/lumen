// Inbox schema — capture-first surface (LUMEN_VISION § 5).
//
// Captures land here unprocessed; users promote them to Nodes via
// keyboard actions (e=edit, t=tag, m=move, x=archive, → promote to task).
// `nodeId` is null until the inbox item is promoted to a Node.

import { index, pgEnum, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { auditTimestamps, idColumn } from './_columns';
import { users } from './auth';
import { nodes } from './nodes';
import { organizations } from './organizations';

export const inboxSourceEnum = pgEnum('inbox_source', [
  'web_quick_capture',
  'desktop_global_hotkey',
  'mobile_share',
  'email_in',
  'api',
]);
export type InboxSource = (typeof inboxSourceEnum.enumValues)[number];

export const inboxStatusEnum = pgEnum('inbox_status', ['pending', 'promoted', 'archived']);
export type InboxStatus = (typeof inboxStatusEnum.enumValues)[number];

export const inboxItems = pgTable(
  'inbox_items',
  {
    id: idColumn(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    source: inboxSourceEnum('source').notNull(),
    status: inboxStatusEnum('status').notNull().default('pending'),
    // Optional URL captured alongside the note (e.g. drag-dropped link).
    sourceUrl: text('source_url'),
    // Idempotency key for desktop hotkey captures so retries don't dupe.
    captureToken: text('capture_token'),
    // Set when status='promoted'.
    nodeId: uuid('node_id').references(() => nodes.id, { onDelete: 'set null' }),
    ...auditTimestamps(),
  },
  (table) => [
    uniqueIndex('inbox_items_capture_token_unique').on(table.captureToken),
    index('inbox_items_user_status_idx').on(table.userId, table.status),
    index('inbox_items_org_idx').on(table.organizationId),
  ],
);
