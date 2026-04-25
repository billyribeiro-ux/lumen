// Server-side Node CRUD + version history + tag mutations + full-text
// search. Every mutation goes through `dbTransact()` so node + version
// + content writes are atomic.
//
// Permission checks happen at the route layer (auth-helpers / rbac).
// This module assumes the caller has already authorized the action.

import { and, desc, eq, ilike, max, or, sql } from 'drizzle-orm';
import { db, dbTransact } from './db';
import { links, type RelationType } from './db/schema/links';
import {
  type NodeStatus,
  type NodeType,
  nodeContent,
  nodes,
  nodeVersions,
} from './db/schema/nodes';
import { nodeTags, tags } from './db/schema/tags';

export interface CreateNodeInput {
  organizationId: string;
  authorId: string;
  type: NodeType;
  title: string;
  body: string;
  slug?: string;
  metadata?: Record<string, unknown>;
  tagNames?: string[];
}

export async function createNode(input: CreateNodeInput) {
  const slug = input.slug ?? slugify(input.title);
  return dbTransact(async (tx) => {
    const [node] = await tx
      .insert(nodes)
      .values({
        organizationId: input.organizationId,
        authorId: input.authorId,
        type: input.type,
        status: 'active',
        title: input.title,
        slug,
        metadata: input.metadata ?? {},
      })
      .returning();
    if (!node) throw new Error('Failed to create node.');

    const [version] = await tx
      .insert(nodeVersions)
      .values({
        nodeId: node.id,
        version: 1,
        body: input.body,
        authorId: input.authorId,
        note: null,
      })
      .returning({ id: nodeVersions.id });

    await tx.insert(nodeContent).values({
      nodeId: node.id,
      currentVersionId: version?.id ?? null,
      body: input.body,
      bodyFormat: 'markdown',
    });

    if (input.tagNames?.length) {
      await attachTagsToNode(tx, {
        organizationId: input.organizationId,
        nodeId: node.id,
        tagNames: input.tagNames,
      });
    }

    return node;
  });
}

export interface UpdateNodeInput {
  id: string;
  authorId: string;
  title?: string;
  body?: string;
  status?: NodeStatus;
  metadata?: Record<string, unknown>;
  versionNote?: string;
}

export async function updateNode(input: UpdateNodeInput) {
  return dbTransact(async (tx) => {
    const [existing] = await tx.select().from(nodes).where(eq(nodes.id, input.id)).limit(1);
    if (!existing) throw new Error('Node not found.');

    const headerPatch: Partial<typeof nodes.$inferInsert> = { updatedAt: new Date() };
    if (input.title !== undefined) headerPatch.title = input.title;
    if (input.status !== undefined) headerPatch.status = input.status;
    if (input.metadata !== undefined) headerPatch.metadata = input.metadata;

    if (Object.keys(headerPatch).length > 1) {
      await tx.update(nodes).set(headerPatch).where(eq(nodes.id, input.id));
    }

    if (input.body !== undefined) {
      const [latest] = await tx
        .select({ next: max(nodeVersions.version) })
        .from(nodeVersions)
        .where(eq(nodeVersions.nodeId, input.id));
      const nextVersion = (latest?.next ?? 0) + 1;

      const [newVersion] = await tx
        .insert(nodeVersions)
        .values({
          nodeId: input.id,
          version: nextVersion,
          body: input.body,
          authorId: input.authorId,
          note: input.versionNote ?? null,
        })
        .returning({ id: nodeVersions.id });

      await tx
        .update(nodeContent)
        .set({
          body: input.body,
          currentVersionId: newVersion?.id ?? null,
          updatedAt: new Date(),
        })
        .where(eq(nodeContent.nodeId, input.id));
    }

    const [updated] = await tx.select().from(nodes).where(eq(nodes.id, input.id)).limit(1);
    return updated;
  });
}

export async function softDeleteNode(id: string) {
  await db.update(nodes).set({ deletedAt: new Date() }).where(eq(nodes.id, id));
}

export async function restoreNode(id: string) {
  await db.update(nodes).set({ deletedAt: null }).where(eq(nodes.id, id));
}

// ── Reads ──────────────────────────────────────────────────────────────

export async function listNodes(
  organizationId: string,
  options?: { type?: NodeType; limit?: number },
) {
  const limit = options?.limit ?? 50;
  const cond = [eq(nodes.organizationId, organizationId)];
  if (options?.type) cond.push(eq(nodes.type, options.type));
  return db
    .select()
    .from(nodes)
    .where(and(...cond))
    .orderBy(desc(nodes.updatedAt))
    .limit(limit);
}

export async function getNodeBySlug(organizationId: string, slug: string) {
  const [node] = await db
    .select()
    .from(nodes)
    .where(and(eq(nodes.organizationId, organizationId), eq(nodes.slug, slug)))
    .limit(1);
  if (!node) return null;
  const [content] = await db
    .select()
    .from(nodeContent)
    .where(eq(nodeContent.nodeId, node.id))
    .limit(1);
  return { node, content };
}

// ── Links ──────────────────────────────────────────────────────────────

export async function createLink(input: {
  sourceNodeId: string;
  targetNodeId: string;
  relationType?: RelationType;
  label?: string;
}) {
  if (input.sourceNodeId === input.targetNodeId) {
    throw new Error('A node cannot link to itself.');
  }
  await db
    .insert(links)
    .values({
      sourceNodeId: input.sourceNodeId,
      targetNodeId: input.targetNodeId,
      relationType: input.relationType ?? 'references',
      label: input.label ?? null,
    })
    .onConflictDoNothing();
}

export async function backlinksFor(nodeId: string) {
  return db
    .select({
      sourceNodeId: links.sourceNodeId,
      relationType: links.relationType,
      label: links.label,
      sourceTitle: nodes.title,
      sourceSlug: nodes.slug,
    })
    .from(links)
    .innerJoin(nodes, eq(links.sourceNodeId, nodes.id))
    .where(eq(links.targetNodeId, nodeId));
}

// ── Tags ───────────────────────────────────────────────────────────────

interface AttachTagsInput {
  organizationId: string;
  nodeId: string;
  tagNames: string[];
}

type Tx = Parameters<Parameters<typeof dbTransact>[0]>[0];

async function attachTagsToNode(tx: Tx, input: AttachTagsInput) {
  for (const raw of input.tagNames) {
    const name = raw.trim().toLowerCase();
    if (!name) continue;
    const [tag] = await tx
      .insert(tags)
      .values({ organizationId: input.organizationId, name })
      .onConflictDoNothing()
      .returning();
    const tagId =
      tag?.id ??
      (
        await tx
          .select({ id: tags.id })
          .from(tags)
          .where(and(eq(tags.organizationId, input.organizationId), eq(tags.name, name)))
          .limit(1)
      )[0]?.id;
    if (!tagId) continue;
    await tx.insert(nodeTags).values({ nodeId: input.nodeId, tagId }).onConflictDoNothing();
  }
}

export async function suggestTags(organizationId: string, query: string, limit = 10) {
  if (!query.trim()) return [];
  return db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .where(and(eq(tags.organizationId, organizationId), ilike(tags.name, `%${query}%`)))
    .limit(limit);
}

// ── Search ─────────────────────────────────────────────────────────────

/**
 * Substring + title search. Phase 6.x will swap to tsvector full-text
 * once the migration that populates `node_content.search_vector` lands;
 * the query shape stays the same.
 */
export async function searchNodes(organizationId: string, query: string, limit = 20) {
  const q = query.trim();
  if (!q) return listNodes(organizationId, { limit });
  const pattern = `%${q}%`;
  return db
    .select({
      id: nodes.id,
      type: nodes.type,
      title: nodes.title,
      slug: nodes.slug,
      updatedAt: nodes.updatedAt,
    })
    .from(nodes)
    .leftJoin(nodeContent, eq(nodeContent.nodeId, nodes.id))
    .where(
      and(
        eq(nodes.organizationId, organizationId),
        or(ilike(nodes.title, pattern), ilike(nodeContent.body, pattern)),
      ),
    )
    .orderBy(desc(nodes.updatedAt))
    .limit(limit);
}

// ── Helpers ────────────────────────────────────────────────────────────

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || `n-${Date.now().toString(36)}`
  );
}

void sql; // exported re-use surface (tsvector queries land in 6.x).
