// RBAC schema — roles, permissions, role_permissions (ARCHITECTURE.md §6.2).
//
// Lumen ships four organization-level roles: owner, admin, editor, viewer.
// Permissions are denormalized into roles for v1 — the role column on
// memberships is the source of truth at runtime; this table set encodes
// the contract so we can grow into fine-grained permissions later
// without a destructive migration.

import { index, pgEnum, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { auditTimestamps, idColumn } from './_columns';

export const roleEnum = pgEnum('role', ['owner', 'admin', 'editor', 'viewer']);
export type Role = (typeof roleEnum.enumValues)[number];

export const roles = pgTable(
  'roles',
  {
    id: idColumn(),
    name: roleEnum('name').notNull(),
    description: text('description').notNull(),
    // Position in the role hierarchy. Lower number = more privileged.
    rank: text('rank').notNull(),
    ...auditTimestamps(),
  },
  (table) => [uniqueIndex('roles_name_unique').on(table.name)],
);

export const permissions = pgTable(
  'permissions',
  {
    id: idColumn(),
    // Action key in dotted notation: `node.update`, `org.invite`, `billing.manage`.
    key: text('key').notNull(),
    description: text('description').notNull(),
    ...auditTimestamps(),
  },
  (table) => [uniqueIndex('permissions_key_unique').on(table.key)],
);

export const rolePermissions = pgTable(
  'role_permissions',
  {
    id: idColumn(),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
    ...auditTimestamps(),
  },
  (table) => [
    uniqueIndex('role_permissions_role_permission_unique').on(table.roleId, table.permissionId),
    index('role_permissions_role_idx').on(table.roleId),
    index('role_permissions_permission_idx').on(table.permissionId),
  ],
);
