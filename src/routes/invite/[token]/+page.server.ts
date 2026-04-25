import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { invitations, organizations } from '$lib/server/db/schema/organizations';
import { acceptInvitation } from '$lib/server/invitations';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  const token = event.params.token;
  const [invite] = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      organizationId: invitations.organizationId,
      acceptedAt: invitations.acceptedAt,
      revokedAt: invitations.revokedAt,
      expiresAt: invitations.expiresAt,
      orgName: organizations.name,
    })
    .from(invitations)
    .leftJoin(organizations, eq(invitations.organizationId, organizations.id))
    .where(eq(invitations.token, token))
    .limit(1);

  if (!invite) return { state: 'not-found' as const };
  if (invite.acceptedAt) return { state: 'accepted' as const, invite };
  if (invite.revokedAt) return { state: 'revoked' as const, invite };
  if (invite.expiresAt < new Date()) return { state: 'expired' as const, invite };

  return {
    state: 'pending' as const,
    invite,
    user: event.locals.user,
  };
};

export const actions: Actions = {
  default: async (event) => {
    const token = event.params.token;
    if (!event.locals.user) {
      const next = `/invite/${token}`;
      throw redirect(303, `/sign-in?next=${encodeURIComponent(next)}`);
    }
    const result = await acceptInvitation({ token, userId: event.locals.user.id });
    throw redirect(303, `/?org=${result.organizationId}&joined=1`);
  },
};
