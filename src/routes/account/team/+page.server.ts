import { fail, redirect } from '@sveltejs/kit';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { requirePermissionFor, requireUser } from '$lib/server/auth-helpers';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema/auth';
import { invitations, memberships, organizations } from '$lib/server/db/schema/organizations';
import type { Role } from '$lib/server/db/schema/rbac';
import { issueInvitation } from '$lib/server/invitations';
import { getRoleForOrg } from '$lib/server/rbac';
import type { Actions, PageServerLoad } from './$types';

const _ROLES: Role[] = ['admin', 'editor', 'viewer'];

export const load: PageServerLoad = async (event) => {
  const user = requireUser(event);

  // Default to the first org the user owns or the first they're in.
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

  const selectedOrgId = event.url.searchParams.get('org') ?? memberOrgs[0]?.id ?? null;
  if (!selectedOrgId) {
    return { memberOrgs, selectedOrgId: null, members: [], invites: [], myRole: null };
  }

  const myRole = await getRoleForOrg(user.id, selectedOrgId);

  const members = await db
    .select({
      userId: memberships.userId,
      role: memberships.role,
      email: users.email,
      name: users.name,
      joinedAt: memberships.joinedAt,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(eq(memberships.organizationId, selectedOrgId));

  const invites = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.organizationId, selectedOrgId),
        isNull(invitations.acceptedAt),
        isNull(invitations.revokedAt),
      ),
    );

  return { memberOrgs, selectedOrgId, members, invites, myRole };
};

export const actions: Actions = {
  invite: async (event) => {
    const data = await event.request.formData();
    const organizationId = String(data.get('organizationId') ?? '');
    const email = String(data.get('email') ?? '').trim();
    const role = String(data.get('role') ?? 'viewer') as Role;

    if (!organizationId) return fail(400, { message: 'Organization missing.' });
    if (!email) return fail(400, { message: 'Email is required.' });
    if (!_ROLES.includes(role)) return fail(400, { message: 'Invalid role.' });

    const { user } = await requirePermissionFor(event, 'org.invite', organizationId);

    await issueInvitation({
      organizationId,
      email,
      role,
      invitedBy: user.id,
    });

    return { invited: email };
  },

  revokeInvite: async (event) => {
    const data = await event.request.formData();
    const organizationId = String(data.get('organizationId') ?? '');
    const inviteId = String(data.get('inviteId') ?? '');

    await requirePermissionFor(event, 'org.invite', organizationId);

    await db
      .update(invitations)
      .set({ revokedAt: new Date() })
      .where(and(eq(invitations.id, inviteId), eq(invitations.organizationId, organizationId)));

    return { revoked: true };
  },

  removeMember: async (event) => {
    const data = await event.request.formData();
    const organizationId = String(data.get('organizationId') ?? '');
    const targetUserId = String(data.get('userId') ?? '');

    const { user } = await requirePermissionFor(event, 'org.member.update', organizationId);
    if (targetUserId === user.id) return fail(400, { message: 'Use Leave organization instead.' });

    // Prevent removing the only owner.
    const ownerRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(memberships)
      .where(and(eq(memberships.organizationId, organizationId), eq(memberships.role, 'owner')));
    const ownerCount = ownerRows[0]?.count ?? 0;
    const targetMember = await db
      .select({ role: memberships.role })
      .from(memberships)
      .where(
        and(eq(memberships.organizationId, organizationId), eq(memberships.userId, targetUserId)),
      )
      .limit(1);
    if (targetMember[0]?.role === 'owner' && ownerCount <= 1) {
      return fail(400, { message: 'Cannot remove the last owner.' });
    }

    await db
      .delete(memberships)
      .where(
        and(eq(memberships.organizationId, organizationId), eq(memberships.userId, targetUserId)),
      );
    return { removed: true };
  },
};

export { _ROLES };

void redirect; // not yet used at this surface; keep available for future flows.
