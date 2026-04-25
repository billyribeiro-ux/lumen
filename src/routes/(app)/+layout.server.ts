import { redirect } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { memberships, organizations } from '$lib/server/db/schema/organizations';
import { getEntitlementProfile } from '$lib/server/entitlements';
import { permissionsForOrg } from '$lib/server/rbac';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
  const user = event.locals.user;
  if (!user) {
    throw redirect(
      303,
      `/sign-in?next=${encodeURIComponent(event.url.pathname + event.url.search)}`,
    );
  }

  const memberOrgs = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.organizationId, organizations.id))
    .where(eq(memberships.userId, user.id))
    .orderBy(sql`${memberships.role} = 'owner' DESC`);

  const orgFromQuery = event.url.searchParams.get('org');
  const orgFromCookie = event.cookies.get('lumen.org');
  const activeOrgId =
    orgFromQuery && memberOrgs.some((o) => o.id === orgFromQuery)
      ? orgFromQuery
      : orgFromCookie && memberOrgs.some((o) => o.id === orgFromCookie)
        ? orgFromCookie
        : (memberOrgs[0]?.id ?? null);

  if (activeOrgId && activeOrgId !== orgFromCookie) {
    event.cookies.set('lumen.org', activeOrgId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      httpOnly: false,
    });
  }

  const { role, keys } = activeOrgId
    ? await permissionsForOrg(user.id, activeOrgId)
    : { role: null, keys: [] as string[] };

  const entitlements = activeOrgId ? await getEntitlementProfile(user.id, activeOrgId) : null;

  const themeCookie = event.cookies.get('lumen.theme');
  const initialTheme: 'obsidian' | 'parchment' | 'nord-pe7' =
    themeCookie === 'parchment' || themeCookie === 'nord-pe7' ? themeCookie : 'obsidian';

  return {
    user,
    memberOrgs,
    activeOrgId,
    role,
    permissions: new Set(keys),
    entitlements,
    initialTheme,
  };
};
