// Nodes schema — the universal unit of content (ARCHITECTURE.md §4.1–§4.3).
//
// Headers (`nodes`), body (`node_content`), and per-edit history
// (`node_versions`) live in three separate tables so list views and
// graph queries don't pull large markdown bodies, and so content
// versioning is independent of metadata changes.

import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { auditTimestamps, idColumn, timestamps } from './_columns';
import { users } from './auth';
import { organizations } from './organizations';

export const nodeTypeEnum = pgEnum('node_type', [
  'note',
  'task',
  'decision',
  'spec',
  'snippet',
  'link',
  'person',
  'project',
  'daily',
]);
export type NodeType = (typeof nodeTypeEnum.enumValues)[number];

export const nodeStatusEnum = pgEnum('node_status', [
  'draft',
  'active',
  'archived',
  // Type-specific terminal states (only meaningful for tasks / decisions)
  'done',
  'cancelled',
  'decided',
  'superseded',
]);
export type NodeStatus = (typeof nodeStatusEnum.enumValues)[number];

export const nodes = pgTable(
  'nodes',
  {
    id: idColumn(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    // Optional project parent — Nodes can live outside projects.
    projectId: uuid('project_id'),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    type: nodeTypeEnum('type').notNull(),
    status: nodeStatusEnum('status').notNull().default('active'),
    title: text('title').notNull(),
    // Slug is unique within the organization for human-readable URLs.
    slug: text('slug').notNull(),
    // Type-specific fields live here so the headers table stays narrow.
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex('nodes_org_slug_unique').on(table.organizationId, table.slug),
    index('nodes_org_type_updated_idx').on(table.organizationId, table.type, table.updatedAt),
    index('nodes_author_idx').on(table.authorId),
    index('nodes_project_idx').on(table.projectId),
  ],
);

export const nodeContent = pgTable(
  'node_content',
  {
    id: idColumn(),
    nodeId: uuid('node_id')
      .notNull()
      .references(() => nodes.id, { onDelete: 'cascade' }),
    // Pointer to the current node_versions row; updated on every edit.
    currentVersionId: uuid('current_version_id'),
    // Materialized current body for fast reads. tsvector index lives on this column.
    body: text('body').notNull().default(''),
    bodyFormat: text('body_format').notNull().default('markdown'),
    // Postgres-generated tsvector column — populated by trigger in the migration.
    searchVector: text('search_vector'),
    ...auditTimestamps(),
  },
  (table) => [uniqueIndex('node_content_node_unique').on(table.nodeId)],
);

export const nodeVersions = pgTable(
  'node_versions',
  {
    id: idColumn(),
    nodeId: uuid('node_id')
      .notNull()
      .references(() => nodes.id, { onDelete: 'cascade' }),
    // Monotonic per node. Set by the application layer on insert.
    version: integer('version').notNull(),
    body: text('body').notNull(),
    bodyFormat: text('body_format').notNull().default('markdown'),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    // Optional commit message ("why I changed this version").
    note: text('note'),
    createdAt: auditTimestamps().createdAt,
  },
  (table) => [
    uniqueIndex('node_versions_node_version_unique').on(table.nodeId, table.version),
    index('node_versions_node_idx').on(table.nodeId),
  ],
);
