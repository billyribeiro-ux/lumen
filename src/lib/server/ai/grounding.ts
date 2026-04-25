// Retrieve nodes relevant to a query for RAG grounding.
//
// v1: simple substring search across titles + bodies, scoped to the
// caller's organization. v1.x: swap for tsvector + embeddings once the
// embedding pipeline lands.
//
// The grounding context is cached at the prompt level via the SDK's
// cache_control flag on the relevant content block, so repeat queries
// over the same node set are cheap.

import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '../db';
import { nodeContent, nodes } from '../db/schema/nodes';

export interface GroundingNode {
  id: string;
  type: string;
  title: string;
  slug: string;
  body: string;
}

export async function fetchGroundingNodes(
  organizationId: string,
  query: string,
  limit = 8,
): Promise<GroundingNode[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const pattern = `%${trimmed}%`;
  const rows = await db
    .select({
      id: nodes.id,
      type: nodes.type,
      title: nodes.title,
      slug: nodes.slug,
      body: nodeContent.body,
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

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    slug: r.slug,
    body: r.body ?? '',
  }));
}

export function formatGroundingForPrompt(grounded: GroundingNode[]): string {
  if (grounded.length === 0) {
    return '<context>The user has no nodes that obviously match this query yet.</context>';
  }
  const blocks = grounded.map(
    (n) => `<node id="${n.id}" type="${n.type}" slug="${n.slug}" title="${escapeXml(n.title)}">
${n.body.slice(0, 1500)}
</node>`,
  );
  return `<context>
The following nodes from the user's Lumen graph are the most likely
relevant. Cite by slug when you reference one.

${blocks.join('\n\n')}
</context>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
