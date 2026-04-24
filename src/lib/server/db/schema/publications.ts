// Publications schema — public Node shares (LUMEN_VISION § 12, ADR-006 entitlement).
//
// One keystroke (⌘⇧P) publishes a Node to a public URL. Publications
// pin a specific node_versions row so editing the Node after publish
// does not silently update the public copy until the user republishes.

import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { auditTimestamps, idColumn } from './_columns';
import { users } from './auth';
import { nodes, nodeVersions } from './nodes';
import { organizations } from './organizations';

export const publications = pgTable(
  'publications',
  {
    id: idColumn(),
    nodeId: uuid('node_id')
      .notNull()
      .references(() => nodes.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    // The version that is publicly served. Updates require an explicit republish.
    publishedVersionId: uuid('published_version_id')
      .notNull()
      .references(() => nodeVersions.id, { onDelete: 'restrict' }),
    publishedById: uuid('published_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    // Subdomain segment under lumen.so. Studio-tier feature (Pro uses path-based publish).
    subdomain: text('subdomain'),
    // Path slug under the subdomain (or under lumen.so for Pro).
    pathSlug: text('path_slug').notNull(),
    // Whether the publication accepts comments.
    commentsEnabled: boolean('comments_enabled').notNull().default(false),
    // Soft-unpublish: setting this to non-null hides the page but preserves the URL.
    unpublishedAt: timestamp('unpublished_at', { withTimezone: true, mode: 'date' }),
    ...auditTimestamps(),
  },
  (table) => [
    uniqueIndex('publications_subdomain_path_unique').on(table.subdomain, table.pathSlug),
    index('publications_node_idx').on(table.nodeId),
    index('publications_org_idx').on(table.organizationId),
  ],
);
