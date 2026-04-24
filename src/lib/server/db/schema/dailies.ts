// Dailies schema — daily notes auto-created at midnight local time (LUMEN_VISION § 4).
//
// One row per user per calendar date. The unique index enforces that.

import { date, index, pgTable, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { auditTimestamps, idColumn } from './_columns';
import { users } from './auth';
import { nodes } from './nodes';

export const dailies = pgTable(
  'dailies',
  {
    id: idColumn(),
    nodeId: uuid('node_id')
      .notNull()
      .references(() => nodes.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Calendar date in the user's preferred timezone (stored as a date,
    // not a timestamp; the timezone is resolved at the application layer).
    dailyDate: date('daily_date').notNull(),
    ...auditTimestamps(),
  },
  (table) => [
    uniqueIndex('dailies_user_date_unique').on(table.userId, table.dailyDate),
    index('dailies_node_idx').on(table.nodeId),
  ],
);
