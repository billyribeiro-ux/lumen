// Lumen seed personas — 15 users across 3 organizations and 4 roles.
//
// Stable, hand-rolled (no faker) so the seed is deterministic across runs.
// Every persona has the same default password "LumenDev2026!" hashed with
// Argon2id at seed time and stored in `accounts` so dev sign-in flows
// (Phase 3) work out of the box.

import type { ProductTier } from '../../src/lib/server/db/schema/billing';
import type { Role } from '../../src/lib/server/db/schema/rbac';

export interface OrgFixture {
  slug: string;
  name: string;
  description: string;
  /** Resolved tier for seeding billing/entitlement rows. */
  tier: ProductTier;
  /** When true, seed creates a 30-day Pro-trial entitlement row but no Stripe subscription. */
  isTrial?: boolean;
}

export interface UserFixture {
  email: string;
  name: string;
  /** Membership role in `orgSlug`. */
  role: Role;
  /** Slug of the organization the user joins. */
  orgSlug: string;
  /** Whether this user is the org owner. Sets organizations.owner_id and role='owner'. */
  isOrgOwner?: boolean;
}

export const SEED_DEFAULT_PASSWORD = 'LumenDev2026!';

export const ORGANIZATIONS: readonly OrgFixture[] = [
  {
    slug: 'lumen-labs',
    name: 'Lumen Labs',
    description: 'Lumen core team — primary studio-tier organization for development.',
    tier: 'studio',
  },
  {
    slug: 'indie-studio',
    name: 'Indie Studio',
    description: 'Three-person Pro-tier shop building tools for solo developers.',
    tier: 'pro',
  },
  {
    slug: 'free-hacker',
    name: 'Free Hacker',
    description: 'Solo developer on the Free tier — used to verify entitlement gating.',
    tier: 'free',
  },
];

export const USERS: readonly UserFixture[] = [
  // Lumen Labs (studio)
  {
    email: 'billy@lumen.so',
    name: 'Billy Ribeiro',
    role: 'owner',
    orgSlug: 'lumen-labs',
    isOrgOwner: true,
  },
  { email: 'sara@lumen.so', name: 'Sara Chen', role: 'admin', orgSlug: 'lumen-labs' },
  { email: 'marcus@lumen.so', name: 'Marcus Wei', role: 'editor', orgSlug: 'lumen-labs' },
  { email: 'priya@lumen.so', name: 'Priya Patel', role: 'editor', orgSlug: 'lumen-labs' },
  { email: 'james@lumen.so', name: 'James Holt', role: 'viewer', orgSlug: 'lumen-labs' },

  // Indie Studio (pro)
  {
    email: 'anna@indie.studio',
    name: 'Anna Müller',
    role: 'owner',
    orgSlug: 'indie-studio',
    isOrgOwner: true,
  },
  { email: 'tomas@indie.studio', name: 'Tomas Reyes', role: 'admin', orgSlug: 'indie-studio' },
  { email: 'elise@indie.studio', name: 'Elise Park', role: 'editor', orgSlug: 'indie-studio' },
  { email: 'david@indie.studio', name: 'David Wong', role: 'viewer', orgSlug: 'indie-studio' },

  // Free Hacker (free)
  {
    email: 'rachel@hacker.io',
    name: 'Rachel Kim',
    role: 'owner',
    orgSlug: 'free-hacker',
    isOrgOwner: true,
  },

  // Trial users — own their own one-person orgs created on the fly during seed.
  // Each trial user gets a Pro-tier 30-day trial entitlement, no Stripe customer.
  {
    email: 'trial-1@example.com',
    name: 'Casey Trial',
    role: 'owner',
    orgSlug: 'trial-casey',
    isOrgOwner: true,
  },
  {
    email: 'trial-2@example.com',
    name: 'Avery Probert',
    role: 'owner',
    orgSlug: 'trial-avery',
    isOrgOwner: true,
  },
  {
    email: 'trial-3@example.com',
    name: 'Jordan Lee',
    role: 'owner',
    orgSlug: 'trial-jordan',
    isOrgOwner: true,
  },
  {
    email: 'trial-4@example.com',
    name: 'Riley Bishop',
    role: 'owner',
    orgSlug: 'trial-riley',
    isOrgOwner: true,
  },
  {
    email: 'trial-5@example.com',
    name: 'Sam Newcombe',
    role: 'owner',
    orgSlug: 'trial-sam',
    isOrgOwner: true,
  },
];

/** Returns true if the org slug is one of the trial-user-owned solo orgs. */
export function isTrialOrg(slug: string): boolean {
  return slug.startsWith('trial-');
}

export const TRIAL_ORG_FIXTURES: OrgFixture[] = USERS.filter((u) => isTrialOrg(u.orgSlug)).map(
  (u) => ({
    slug: u.orgSlug,
    name: `${u.name.split(' ')[0]}'s Workspace`,
    description: `30-day Pro trial workspace for ${u.name}.`,
    // Effective tier during the trial is `pro`; isTrial signals seed to set trialEndsAt.
    tier: 'pro' as const,
    isTrial: true,
  }),
);
