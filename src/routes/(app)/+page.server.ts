import { listNodes } from '$lib/server/nodes';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const layout = await parent();
  if (!layout.activeOrgId) return { recent: [] };
  const recent = await listNodes(layout.activeOrgId, { limit: 25 });
  return { recent };
};
