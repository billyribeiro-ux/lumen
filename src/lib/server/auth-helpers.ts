// Server-side load/action helpers that pair with `$lib/server/rbac`.
// Use these inside +page.server.ts and +server.ts files instead of
// hand-rolling redirect/abort logic.

import { error, type RequestEvent, redirect } from '@sveltejs/kit';
import type { Role } from './db/schema/rbac';
import { getRoleForOrg, type PermissionContext, requirePermission } from './rbac';

/**
 * Throws a 303 to /sign-in if no user is on the request, otherwise
 * returns the user object.
 */
export function requireUser(event: RequestEvent) {
  const user = event.locals.user;
  if (!user) {
    const next = event.url.pathname + event.url.search;
    throw redirect(303, `/sign-in?next=${encodeURIComponent(next)}`);
  }
  return user;
}

/**
 * Like requireUser, but additionally requires membership of `organizationId`.
 * Returns the user + the user's role on that org.
 */
export async function requireMember(event: RequestEvent, organizationId: string) {
  const user = requireUser(event);
  const role = await getRoleForOrg(user.id, organizationId);
  if (!role) error(403, 'You are not a member of this organization.');
  return { user, role };
}

/**
 * Hard role gate — throws 403 unless the user holds AT LEAST `minRole`
 * (using the order owner > admin > editor > viewer).
 */
export async function requireOrgRole(event: RequestEvent, organizationId: string, minRole: Role) {
  const { user, role } = await requireMember(event, organizationId);
  const rank: Record<Role, number> = { owner: 0, admin: 1, editor: 2, viewer: 3 };
  if (rank[role] > rank[minRole]) {
    error(403, `${minRole} role or above required.`);
  }
  return { user, role };
}

/**
 * Permission gate — throws 401/403 via SvelteKit's `error()` if the
 * user cannot perform `permissionKey` in `organizationId`. Returns the
 * user object plus the resolved role on success.
 */
export async function requirePermissionFor(
  event: RequestEvent,
  permissionKey: string,
  organizationId: string,
) {
  const user = requireUser(event);
  const ctx: PermissionContext = { user, organizationId };
  const role = await requirePermission(ctx, permissionKey);
  return { user, role };
}
