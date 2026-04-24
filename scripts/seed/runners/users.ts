// Users + organizations + memberships + accounts (with Argon2id-hashed
// dev passwords) + entitlements seed.
//
// Returns a map from email → user id and slug → org id so downstream
// runners (content, billing) can link rows together.

import { hash } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';
import { accounts, users } from '../../../src/lib/server/db/schema/auth';
import { entitlements, type ProductTier } from '../../../src/lib/server/db/schema/billing';
import { memberships, organizations } from '../../../src/lib/server/db/schema/organizations';
import type { SeedDb } from '../connection';
import {
  isTrialOrg,
  ORGANIZATIONS,
  type OrgFixture,
  SEED_DEFAULT_PASSWORD,
  TRIAL_ORG_FIXTURES,
  USERS,
} from '../personas';

export interface SeededUsers {
  userIdByEmail: Map<string, string>;
  orgIdBySlug: Map<string, string>;
  orgFixtureBySlug: Map<string, OrgFixture>;
}

// OWASP 2024 Argon2id parameters per ADR-004.
const ARGON2_OPTIONS = {
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} as const;

export async function seedUsersAndOrgs(db: SeedDb): Promise<SeededUsers> {
  const passwordHash = await hash(SEED_DEFAULT_PASSWORD, ARGON2_OPTIONS);

  // 1. Users ────────────────────────────────────────────────
  for (const fixture of USERS) {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, fixture.email))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(users).values({
        email: fixture.email,
        emailVerified: true,
        name: fixture.name,
      });
    }
  }
  const allUsers = await db.select({ id: users.id, email: users.email }).from(users);
  const userIdByEmail = new Map(allUsers.map((u) => [u.email, u.id]));

  // 2. Organizations ────────────────────────────────────────
  const allFixtures: OrgFixture[] = [...ORGANIZATIONS, ...TRIAL_ORG_FIXTURES];
  for (const fixture of allFixtures) {
    const ownerEmail = USERS.find((u) => u.orgSlug === fixture.slug && u.isOrgOwner)?.email;
    if (!ownerEmail) {
      throw new Error(`Seed inconsistency: no owner declared for org "${fixture.slug}".`);
    }
    const ownerId = userIdByEmail.get(ownerEmail);
    if (!ownerId) {
      throw new Error(`Seed inconsistency: owner user "${ownerEmail}" not found.`);
    }
    const existing = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, fixture.slug))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(organizations).values({
        name: fixture.name,
        slug: fixture.slug,
        description: fixture.description,
        ownerId,
      });
    }
  }
  const allOrgs = await db
    .select({ id: organizations.id, slug: organizations.slug })
    .from(organizations);
  const orgIdBySlug = new Map(allOrgs.map((o) => [o.slug, o.id]));
  const orgFixtureBySlug = new Map(allFixtures.map((f) => [f.slug, f]));

  // 3. Memberships ──────────────────────────────────────────
  for (const fixture of USERS) {
    const userId = userIdByEmail.get(fixture.email);
    const organizationId = orgIdBySlug.get(fixture.orgSlug);
    if (!userId || !organizationId) continue;
    const existing = await db
      .select({ id: memberships.id })
      .from(memberships)
      .where(eq(memberships.userId, userId))
      .limit(1);
    if (existing.length === 0 || existing.every((m) => m.id !== organizationId)) {
      // Idempotent insert via the user_org unique index. The select above
      // is a coarse pre-check; a unique-violation here is benign.
      try {
        await db.insert(memberships).values({
          userId,
          organizationId,
          role: fixture.role,
        });
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
      }
    }
  }

  // 4. Credential accounts (one per user) ──────────────────
  for (const fixture of USERS) {
    const userId = userIdByEmail.get(fixture.email);
    if (!userId) continue;
    const existing = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(accounts).values({
        userId,
        providerId: 'credential',
        accountId: fixture.email,
        password: passwordHash,
      });
    }
  }

  // 5. Entitlements ─────────────────────────────────────────
  // Lumen Labs members → studio. Indie Studio → pro. Free Hacker → free.
  // Trial users → pro with trial_ends_at = now + 30 days.
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  for (const fixture of USERS) {
    const userId = userIdByEmail.get(fixture.email);
    const organizationId = orgIdBySlug.get(fixture.orgSlug);
    const orgFixture = orgFixtureBySlug.get(fixture.orgSlug);
    if (!userId || !organizationId || !orgFixture) continue;

    const tier: ProductTier = orgFixture.tier;
    const trialEndsAt = orgFixture.isTrial ? new Date(now + thirtyDaysMs) : null;

    const existing = await db
      .select({ id: entitlements.id })
      .from(entitlements)
      .where(eq(entitlements.userId, userId))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(entitlements).values({
        organizationId,
        userId,
        tier,
        limits: limitsForTier(tier),
        trialEndsAt,
        lastReconciledAt: new Date(now),
      });
    }
  }

  return { userIdByEmail, orgIdBySlug, orgFixtureBySlug };
}

function limitsForTier(tier: ProductTier): Record<string, number | boolean> {
  switch (tier) {
    case 'free':
      return {
        maxNodes: 100,
        maxProjects: 1,
        aiQueriesPerMonth: 0,
        canPublish: false,
        canUseDesktop: false,
        maxSeats: 1,
      };
    case 'pro':
      return {
        maxNodes: -1,
        maxProjects: -1,
        aiQueriesPerMonth: 100,
        canPublish: true,
        canUseDesktop: true,
        maxSeats: 1,
      };
    case 'studio':
      return {
        maxNodes: -1,
        maxProjects: -1,
        aiQueriesPerMonth: -1,
        canPublish: true,
        canUseDesktop: true,
        maxSeats: 5,
      };
  }
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: unknown }).code === '23505'
  );
}

// Re-export so wipe.ts can clear these.
export { accounts, entitlements, isTrialOrg, memberships, organizations, users };
