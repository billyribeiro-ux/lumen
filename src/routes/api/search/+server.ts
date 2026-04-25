import { json } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth-helpers';
import { searchNodes } from '$lib/server/nodes';
import { getRoleForOrg } from '$lib/server/rbac';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  const user = requireUser(event);
  const orgId = event.cookies.get('lumen.org');
  if (!orgId) return json([]);

  const role = await getRoleForOrg(user.id, orgId);
  if (!role) return json([]);

  const q = event.url.searchParams.get('q') ?? '';
  const hits = await searchNodes(orgId, q, 15);
  return json(hits);
};
