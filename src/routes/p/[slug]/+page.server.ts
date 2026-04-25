import { error } from '@sveltejs/kit';
import { getPublic } from '$lib/server/publishing';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  // Subdomain routing is handled at the edge (Vercel) — for v1.4.0 we
  // resolve only the path-based variant. Custom subdomains will pass
  // a request header set by the edge function once Phase 18.x ships.
  const subdomain = event.request.headers.get('x-lumen-subdomain') ?? undefined;
  const result = await getPublic(event.params.slug, subdomain);
  if (!result) error(404, 'This page is not published or has been unpublished.');
  return { pub: result };
};
