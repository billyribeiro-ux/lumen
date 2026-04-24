// Decisions schema — ADR satellite table (ARCHITECTURE.md §4.6).
//
// Stores decision-specific structure beyond the generic node.metadata
// JSONB blob. Linked 1:1 to the parent node row by node_id. Once
// status='decided' the decision is immutable; supersede via a new
// decision linked back through links.relation_type='supersedes'.

import { sql } from 'drizzle-orm';
import { jsonb, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { auditTimestamps, idColumn } from './_columns';
import { nodes } from './nodes';

export const decisions = pgTable(
  'decisions',
  {
    id: idColumn(),
    nodeId: uuid('node_id')
      .notNull()
      .references(() => nodes.id, { onDelete: 'cascade' }),
    context: text('context').notNull(),
    // Options under consideration; JSON array of { name, pros, cons } objects.
    options: jsonb('options').notNull().default(sql`'[]'::jsonb`),
    decision: text('decision'),
    consequences: text('consequences'),
    // Pointer to the decision that supersedes this one (null until superseded).
    supersededById: uuid('superseded_by_id'),
    ...auditTimestamps(),
  },
  (table) => [uniqueIndex('decisions_node_unique').on(table.nodeId)],
);
