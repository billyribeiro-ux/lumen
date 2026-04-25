// Tags schema — hashtag-style classification (ARCHITECTURE.md §4.5).
//
// Tags belong to organizations (not users) so they're shareable across
// teammates within the same org. node_tags is the M:N junction.
// Trigram indexes for fuzzy autocomplete are added in the migration.

import { index, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { auditTimestamps, idColumn } from './_columns';
import { nodes } from './nodes';
import { organizations } from './organizations';

export const tags = pgTable(
  'tags',
  {
    id: idColumn(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    // Optional OKLCH accent color for UI rendering. Validated at the
    // application layer via valibot before write.
    color: text('color'),
    description: text('description'),
    ...auditTimestamps(),
  },
  (table) => [
    uniqueIndex('tags_org_name_unique').on(table.organizationId, table.name),
    index('tags_org_idx').on(table.organizationId),
  ],
);

export const nodeTags = pgTable(
  'node_tags',
  {
    id: idColumn(),
    nodeId: uuid('node_id')
      .notNull()
      .references(() => nodes.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    createdAt: auditTimestamps().createdAt,
  },
  (table) => [
    uniqueIndex('node_tags_node_tag_unique').on(table.nodeId, table.tagId),
    index('node_tags_node_idx').on(table.nodeId),
    index('node_tags_tag_idx').on(table.tagId),
  ],
);
