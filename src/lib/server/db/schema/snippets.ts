// Snippets schema — language-aware code blocks (ARCHITECTURE.md §4.6).
//
// Highlighted HTML is computed by Shiki at write time and cached here
// so list views don't re-highlight on every render.

import { pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { auditTimestamps, idColumn } from './_columns';
import { nodes } from './nodes';

export const snippets = pgTable(
  'snippets',
  {
    id: idColumn(),
    nodeId: uuid('node_id')
      .notNull()
      .references(() => nodes.id, { onDelete: 'cascade' }),
    language: text('language').notNull(),
    filename: text('filename'),
    code: text('code').notNull(),
    // Pre-rendered HTML from Shiki (Phase 6). Refreshed when code changes.
    highlightedHtml: text('highlighted_html'),
    ...auditTimestamps(),
  },
  (table) => [uniqueIndex('snippets_node_unique').on(table.nodeId)],
);
