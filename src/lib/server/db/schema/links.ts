// Links schema — typed bidirectional edges between Nodes (ARCHITECTURE.md §4.4).
//
// Backlinks are not a separate table; they are a reverse query on this
// table indexed by target_node_id. Relation type is enforced by enum
// at the database level.

import { sql } from 'drizzle-orm';
import { check, index, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { auditTimestamps, idColumn } from './_columns';
import { nodes } from './nodes';

export const relationTypeEnum = pgEnum('relation_type', [
  'references',
  'blocks',
  'related',
  'supersedes',
  'derives_from',
  'embeds',
]);
export type RelationType = (typeof relationTypeEnum.enumValues)[number];

export const links = pgTable(
  'links',
  {
    id: idColumn(),
    sourceNodeId: uuid('source_node_id')
      .notNull()
      .references(() => nodes.id, { onDelete: 'cascade' }),
    targetNodeId: uuid('target_node_id')
      .notNull()
      .references(() => nodes.id, { onDelete: 'cascade' }),
    relationType: relationTypeEnum('relation_type').notNull().default('references'),
    // Optional context note: "see this link from the auth thread".
    label: text('label'),
    ...auditTimestamps(),
  },
  (table) => [
    index('links_source_idx').on(table.sourceNodeId),
    index('links_target_idx').on(table.targetNodeId),
    index('links_relation_idx').on(table.relationType),
    // Self-link guard at the DB level.
    check('links_no_self_link', sql`${table.sourceNodeId} <> ${table.targetNodeId}`),
  ],
);
