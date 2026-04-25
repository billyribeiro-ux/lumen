// Lumen RBAC — `can()` and `requirePermission()` helpers (ADR-004 §6).
//
// Server-authoritative permission model. The seed (Phase 2) populates
// the role↔permission matrix; this module reads it and answers "may
// this user perform this action against this resource?" in a single
// SQL query.
//
// Resource scoping is encoded in the `key` itself:
//   - 'org.invite'         org-scoped → caller's role on the org
//   - 'node.update'        node-scoped → caller's role on the node's org
//   - 'billing.manage'     org-scoped → caller's role on the org
//
// Resource references are passed via the `resource` parameter. The
// caller is responsible for resolving the org id when the resource is
// a node, project, etc.

import { error } from '@sveltejs/kit';
import { and, eq, inArray } from 'drizzle-orm';
import type { AuthSession } from './auth';
import { db } from './db';
import { memberships } from './db/schema/organizations';
import { permissions, type Role, rolePermissions, roles } from './db/schema/rbac';

type AuthUser = NonNullable<AuthSession>['user'];

export interface PermissionContext {
  /** The user attempting the action. Pass null/undefined for anonymous. */
  user: AuthUser | null | undefined;
  /** The organization scope. Required for org-scoped permissions. */
  organizationId: string;
}

/**
 * Returns true if the caller may perform `permissionKey` within `organizationId`.
 *
 * Resolves the user's role on the org via `memberships`, then checks the
 * role↔permission matrix in `role_permissions`.
 */
export async function can(ctx: PermissionContext, permissionKey: string): Promise<boolean> {
  if (!ctx.user) return false;

  const role = await getRoleForOrg(ctx.user.id, ctx.organizationId);
  if (!role) return false;

  // Owner always wins. Cheap short-circuit avoids the join.
  if (role === 'owner') return true;

  const rows = await db
    .select({ key: permissions.key })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
    .where(and(eq(roles.name, role), eq(permissions.key, permissionKey)))
    .limit(1);

  return rows.length > 0;
}

/**
 * Throws a SvelteKit 403 if the caller cannot perform `permissionKey`.
 * Throws 401 if anonymous. Returns the user's role on the org otherwise.
 */
export async function requirePermission(
  ctx: PermissionContext,
  permissionKey: string,
): Promise<Role> {
  if (!ctx.user) error(401, 'Sign in required.');

  const role = await getRoleForOrg(ctx.user.id, ctx.organizationId);
  if (!role) error(403, `You are not a member of this organization.`);

  if (role === 'owner') return role;

  const rows = await db
    .select({ key: permissions.key })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
    .where(and(eq(roles.name, role), eq(permissions.key, permissionKey)))
    .limit(1);

  if (rows.length === 0) {
    error(403, `Your role (${role}) does not allow ${permissionKey}.`);
  }

  return role;
}

/** Returns the user's role on the org, or `null` if not a member. */
export async function getRoleForOrg(userId: string, organizationId: string): Promise<Role | null> {
  const rows = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.organizationId, organizationId)))
    .limit(1);
  const role = rows[0]?.role;
  if (!role) return null;
  // memberships.role is `text` for forward-compat; narrow back to Role here.
  if (role === 'owner' || role === 'admin' || role === 'editor' || role === 'viewer') {
    return role;
  }
  return null;
}

/** Returns every org id the user is a member of. */
export async function getMemberOrgIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ organizationId: memberships.organizationId })
    .from(memberships)
    .where(eq(memberships.userId, userId));
  return rows.map((r) => r.organizationId);
}

/**
 * Bulk fetch the user's permission keys for an org. Useful for hydrating
 * UI state on a page load — let the client gate via $page.data.permissions
 * while the server still authoritatively re-checks on every action.
 */
export async function permissionsForOrg(
  userId: string,
  organizationId: string,
): Promise<{ role: Role | null; keys: string[] }> {
  const role = await getRoleForOrg(userId, organizationId);
  if (!role) return { role: null, keys: [] };

  if (role === 'owner') {
    const allKeys = await db.select({ key: permissions.key }).from(permissions);
    return { role, keys: allKeys.map((r) => r.key) };
  }

  const rows = await db
    .select({ key: permissions.key })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
    .where(eq(roles.name, role));

  return { role, keys: rows.map((r) => r.key) };
}

/** Comparator that returns true if `a` outranks `b` (lower rank = more privileged). */
export function outranks(a: Role, b: Role): boolean {
  const order: Role[] = ['owner', 'admin', 'editor', 'viewer'];
  return order.indexOf(a) < order.indexOf(b);
}

void inArray; // kept for future bulk APIs.
