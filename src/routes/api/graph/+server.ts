// /api/graph — return the current org's node + link snapshot for
// the WebGPU graph view to render.

import { json, type RequestHandler } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import { requireUser } from '$lib/server/auth-helpers';
import { db } from '$lib/server/db';
import { links } from '$lib/server/db/schema/links';
import { nodes } from '$lib/server/db/schema/nodes';
import { getRoleForOrg } from '$lib/server/rbac';

export const GET: RequestHandler = async (event) => {
  const user = requireUser(event);
  const orgId = event.cookies.get('lumen.org');
  if (!orgId) return json({ nodes: [], links: [] });
  const role = await getRoleForOrg(user.id, orgId);
  if (!role) return json({ nodes: [], links: [] });

  const nodeRows = await db
    .select({
      id: nodes.id,
      type: nodes.type,
      title: nodes.title,
      slug: nodes.slug,
      updatedAt: nodes.updatedAt,
    })
    .from(nodes)
    .where(and(eq(nodes.organizationId, orgId), isNull(nodes.deletedAt)))
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
    .where(eq(nodes.organizationId, orgId))
    .limit(5000);

  return json({ nodes: nodeRows, links: linkRows });
};
