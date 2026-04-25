// Public publishing — pin a node version to a public URL.
//
// publish() creates or updates a `publications` row with the current
// node_versions.id pinned, so editing the node afterwards does not
// silently update the public copy until the user republishes.
//
// unpublish() sets unpublished_at and the public renderer 404s.

import { error } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import { db, dbTransact } from './db';
import { nodeContent, nodes, nodeVersions } from './db/schema/nodes';
import { publications } from './db/schema/publications';

export interface PublishInput {
  nodeId: string;
  organizationId: string;
  publishedById: string;
  /** When the publisher is on Studio, set the subdomain. */
  subdomain?: string;
  /** When false (default), do not allow comments. */
  commentsEnabled?: boolean;
  pathSlug: string;
}

export async function publish(input: PublishInput) {
  return dbTransact(async (tx) => {
    const [node] = await tx
      .select({ id: nodes.id, organizationId: nodes.organizationId, slug: nodes.slug })
      .from(nodes)
      .where(eq(nodes.id, input.nodeId))
      .limit(1);
    if (!node || node.organizationId !== input.organizationId) {
      error(404, 'Node not found.');
    }

    const [content] = await tx
      .select({ currentVersionId: nodeContent.currentVersionId })
      .from(nodeContent)
      .where(eq(nodeContent.nodeId, input.nodeId))
      .limit(1);
    if (!content?.currentVersionId) error(409, 'Node has no published-able version.');

    const [existing] = await tx
      .select()
      .from(publications)
      .where(eq(publications.nodeId, input.nodeId))
      .limit(1);

    if (existing) {
      await tx
        .update(publications)
        .set({
          publishedVersionId: content.currentVersionId,
          publishedById: input.publishedById,
          subdomain: input.subdomain ?? null,
          pathSlug: input.pathSlug,
          commentsEnabled: input.commentsEnabled ?? false,
          unpublishedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(publications.id, existing.id));
      return existing;
    }

    const [row] = await tx
      .insert(publications)
      .values({
        nodeId: input.nodeId,
        organizationId: input.organizationId,
        publishedVersionId: content.currentVersionId,
        publishedById: input.publishedById,
        subdomain: input.subdomain ?? null,
        pathSlug: input.pathSlug,
        commentsEnabled: input.commentsEnabled ?? false,
      })
      .returning();
    if (!row) error(500, 'Failed to publish.');
    return row;
  });
}

export async function unpublish(nodeId: string, organizationId: string) {
  await db
    .update(publications)
    .set({ unpublishedAt: new Date() })
    .where(and(eq(publications.nodeId, nodeId), eq(publications.organizationId, organizationId)));
}

export async function getPublic(pathSlug: string, subdomain?: string) {
  const cond = subdomain
    ? and(eq(publications.subdomain, subdomain), eq(publications.pathSlug, pathSlug))
    : and(isNull(publications.subdomain), eq(publications.pathSlug, pathSlug));

  const [row] = await db
    .select({
      title: nodes.title,
      slug: nodes.slug,
      publishedAt: publications.createdAt,
      updatedAt: publications.updatedAt,
      commentsEnabled: publications.commentsEnabled,
      body: nodeVersions.body,
      bodyFormat: nodeVersions.bodyFormat,
      organizationId: publications.organizationId,
    })
    .from(publications)
    .innerJoin(nodes, eq(nodes.id, publications.nodeId))
    .innerJoin(nodeVersions, eq(nodeVersions.id, publications.publishedVersionId))
    .where(and(cond, isNull(publications.unpublishedAt)))
    .limit(1);
  return row ?? null;
}
