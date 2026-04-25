// Invitation issuance + acceptance.
//
// Tokens are 32 random url-safe base64 chars (192 bits of entropy).
// 7-day TTL by default. Email delivery uses the Phase 7 sendEmail
// helper — Resend in production, stderr in dev.

import { error } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import { db, dbTransact } from './db';
import { users } from './db/schema/auth';
import { invitations, memberships, organizations } from './db/schema/organizations';
import type { Role } from './db/schema/rbac';

export interface IssueInvitationInput {
  organizationId: string;
  email: string;
  role: Role;
  invitedBy: string;
  expiresInDays?: number;
}

export async function issueInvitation(input: IssueInvitationInput): Promise<{
  id: string;
  token: string;
  expiresAt: Date;
}> {
  const expiresAt = new Date(Date.now() + (input.expiresInDays ?? 7) * 24 * 60 * 60 * 1000);
  const token = generateToken();

  // Revoke any prior outstanding invitation for the same (org, email).
  await db
    .update(invitations)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(invitations.organizationId, input.organizationId),
        eq(invitations.email, input.email.toLowerCase().trim()),
        isNull(invitations.acceptedAt),
        isNull(invitations.revokedAt),
      ),
    );

  const [row] = await db
    .insert(invitations)
    .values({
      organizationId: input.organizationId,
      email: input.email.toLowerCase().trim(),
      role: input.role,
      token,
      invitedBy: input.invitedBy,
      expiresAt,
    })
    .returning({ id: invitations.id, token: invitations.token, expiresAt: invitations.expiresAt });

  if (!row) error(500, 'Failed to issue invitation.');

  await sendInviteEmail({
    organizationId: input.organizationId,
    email: input.email,
    role: input.role,
    invitedBy: input.invitedBy,
    token: row.token,
  });

  return row;
}

async function sendInviteEmail(input: {
  organizationId: string;
  email: string;
  role: string;
  invitedBy: string;
  token: string;
}): Promise<void> {
  const { sendEmail } = await import('./email');
  const { default: TeamInvite } = await import('./email/templates/TeamInvite.svelte');

  // Resolve org name + inviter name for the template.
  const [{ default: TeamInviteImport }, orgRows, inviterRows] = await Promise.all([
    import('./email/templates/TeamInvite.svelte'),
    db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, input.organizationId))
      .limit(1),
    db.select({ name: users.name }).from(users).where(eq(users.id, input.invitedBy)).limit(1),
  ]);
  void TeamInviteImport;

  const orgName = orgRows[0]?.name ?? 'a team';
  const inviterName = inviterRows[0]?.name ?? 'A teammate';
  const baseUrl = process.env['BETTER_AUTH_URL'] ?? 'http://localhost:5173';
  const acceptUrl = `${baseUrl}/invite/${input.token}`;

  await sendEmail({
    to: input.email,
    subject: `${inviterName} invited you to ${orgName} on Lumen`,
    template: TeamInvite,
    props: { inviterName, organizationName: orgName, role: input.role, acceptUrl },
    tags: [{ name: 'category', value: 'team_invite' }],
  });
}

export async function acceptInvitation(input: { token: string; userId: string }): Promise<{
  organizationId: string;
  role: Role;
}> {
  const now = new Date();

  const [invite] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.token, input.token))
    .limit(1);

  if (!invite) error(404, 'Invitation not found.');
  if (invite.acceptedAt) error(410, 'Invitation already accepted.');
  if (invite.revokedAt) error(410, 'Invitation revoked.');
  if (invite.expiresAt < now) error(410, 'Invitation expired.');

  // The accepting user's email must match the invited email.
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1);
  if (!user) error(401, 'Sign in to accept invitations.');
  if (user.email.toLowerCase() !== invite.email) {
    error(403, `This invitation was sent to ${invite.email}.`);
  }

  await dbTransact(async (tx) => {
    await tx
      .insert(memberships)
      .values({
        userId: input.userId,
        organizationId: invite.organizationId,
        role: invite.role,
        invitedBy: invite.invitedBy,
      })
      .onConflictDoNothing();

    await tx.update(invitations).set({ acceptedAt: now }).where(eq(invitations.id, invite.id));
  });

  return { organizationId: invite.organizationId, role: invite.role as Role };
}

function generateToken(): string {
  // 32 url-safe base64 chars = 24 bytes = 192 bits. Crypto.randomUUID
  // would also work but base64 keeps URLs shorter.
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
