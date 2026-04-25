// RBAC seed — roles + permissions + role_permissions.
//
// Idempotent: ON CONFLICT DO NOTHING (via inArray + skip-existing).

import { inArray } from 'drizzle-orm';
import {
  permissions,
  type Role,
  rolePermissions,
  roles,
} from '../../../src/lib/server/db/schema/rbac';
import type { SeedDb } from '../connection';

const ROLE_DEFINITIONS: ReadonlyArray<{ name: Role; description: string; rank: string }> = [
  {
    name: 'owner',
    description: 'Full control of the organization, including billing and deletion.',
    rank: '0',
  },
  {
    name: 'admin',
    description:
      'Manages members, projects, and settings; cannot delete the org or change billing.',
    rank: '1',
  },
  {
    name: 'editor',
    description: 'Creates and modifies nodes, links, tags. No org-management permissions.',
    rank: '2',
  },
  { name: 'viewer', description: 'Read-only access to nodes and structure.', rank: '3' },
];

interface PermissionDef {
  key: string;
  description: string;
}

const PERMISSION_DEFINITIONS: readonly PermissionDef[] = [
  // Org management
  { key: 'org.update', description: 'Update organization name, slug, description.' },
  { key: 'org.delete', description: 'Delete the organization (soft delete + 30-day grace).' },
  { key: 'org.invite', description: 'Invite new members to the organization.' },
  { key: 'org.member.update', description: "Change a member's role or remove them." },

  // Billing
  { key: 'billing.read', description: 'Read subscription, invoice, and payment-method state.' },
  { key: 'billing.manage', description: 'Change subscription, payment methods, cancel.' },

  // Node CRUD
  { key: 'node.read', description: 'Read nodes within the organization.' },
  { key: 'node.create', description: 'Create new nodes.' },
  { key: 'node.update', description: 'Update existing nodes.' },
  { key: 'node.delete', description: 'Soft-delete nodes.' },
  { key: 'node.publish', description: 'Publish a node to a public URL (Pro+).' },

  // Tags / links / inbox
  { key: 'tag.manage', description: 'Create, rename, and delete organization tags.' },
  { key: 'link.create', description: 'Create or remove typed links between nodes.' },
  { key: 'inbox.process', description: 'Promote inbox items to nodes; archive items.' },

  // AI co-pilot
  { key: 'ai.chat', description: 'Open AI co-pilot conversations grounded in the org graph.' },

  // Audit
  { key: 'audit.read', description: 'Read the organization audit log.' },
];

/** Default role → permissions matrix. */
const ROLE_PERMISSION_MATRIX: Record<Role, readonly string[]> = {
  owner: PERMISSION_DEFINITIONS.map((p) => p.key),
  admin: [
    'org.update',
    'org.invite',
    'org.member.update',
    'billing.read',
    'billing.manage',
    'node.read',
    'node.create',
    'node.update',
    'node.delete',
    'node.publish',
    'tag.manage',
    'link.create',
    'inbox.process',
    'ai.chat',
    'audit.read',
  ],
  editor: [
    'node.read',
    'node.create',
    'node.update',
    'node.delete',
    'node.publish',
    'tag.manage',
    'link.create',
    'inbox.process',
    'ai.chat',
  ],
  viewer: ['node.read'],
};

export async function seedRbac(db: SeedDb): Promise<void> {
  // Roles ────────────────────────────────────────────────
  const existingRoles = await db.select({ name: roles.name }).from(roles);
  const existingRoleNames = new Set(existingRoles.map((r) => r.name));
  const rolesToInsert = ROLE_DEFINITIONS.filter((r) => !existingRoleNames.has(r.name));
  if (rolesToInsert.length > 0) {
    await db.insert(roles).values(rolesToInsert);
  }

  // Permissions ───────────────────────────────────────────
  const existingPermissions = await db.select({ key: permissions.key }).from(permissions);
  const existingPermissionKeys = new Set(existingPermissions.map((p) => p.key));
  const permissionsToInsert = PERMISSION_DEFINITIONS.filter(
    (p) => !existingPermissionKeys.has(p.key),
  );
  if (permissionsToInsert.length > 0) {
    await db.insert(permissions).values(permissionsToInsert);
  }

  // Resolve full row ids for joining
  const allRoles = await db.select().from(roles);
  const allPermissions = await db.select().from(permissions);

  const permissionByKey = new Map(allPermissions.map((p) => [p.key, p]));
  const roleByName = new Map(allRoles.map((r) => [r.name, r]));

  // Role-permission joins ─────────────────────────────────
  const desiredJoins: Array<{ roleId: string; permissionId: string }> = [];
  for (const [roleName, keys] of Object.entries(ROLE_PERMISSION_MATRIX) as Array<
    [Role, readonly string[]]
  >) {
    const role = roleByName.get(roleName);
    if (!role) continue;
    for (const key of keys) {
      const perm = permissionByKey.get(key);
      if (!perm) continue;
      desiredJoins.push({ roleId: role.id, permissionId: perm.id });
    }
  }

  // Idempotent: only insert joins not already present
  if (desiredJoins.length > 0) {
    const existing = await db
      .select({ roleId: rolePermissions.roleId, permissionId: rolePermissions.permissionId })
      .from(rolePermissions)
      .where(
        inArray(
          rolePermissions.roleId,
          desiredJoins.map((j) => j.roleId),
        ),
      );
    const existingKeys = new Set(existing.map((j) => `${j.roleId}:${j.permissionId}`));
    const toInsert = desiredJoins.filter((j) => !existingKeys.has(`${j.roleId}:${j.permissionId}`));
    if (toInsert.length > 0) {
      await db.insert(rolePermissions).values(toInsert);
    }
  }
}

// Re-export for the wipe runner that needs to clear these tables.
export { permissions, rolePermissions, roles };
