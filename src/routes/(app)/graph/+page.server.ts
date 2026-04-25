import { and, eq, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { links } from '$lib/server/db/schema/links';
import { nodes } from '$lib/server/db/schema/nodes';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const layout = await parent();
  if (!layout.activeOrgId) return { nodes: [], links: [] };

  const nodeRows = await db
    .select({
      id: nodes.id,
      type: nodes.type,
      title: nodes.title,
      slug: nodes.slug,
    })
    .from(nodes)
    .where(and(eq(nodes.organizationId, layout.activeOrgId), isNull(nodes.deletedAt)))
    .limit(1500);

  const linkRows = await db
    .select({
      id: links.id,
      source: links.sourceNodeId,
      target: links.targetNodeId,
      relationType: links.relationType,
    })
    .from(links)
    .innerJoin(nodes, eq(links.sourceNodeId, nodes.id))
    .where(eq(nodes.organizationId, layout.activeOrgId))
    .limit(5000);

  return { nodes: nodeRows, links: linkRows };
};
