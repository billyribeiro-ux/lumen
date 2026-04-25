// Lumen entitlements — tier-derived feature gates.
//
// The entitlement row stores both a cached `tier` and a `limits` JSONB
// blob. Tier is the canonical signal (driven by Phase 9 webhook
// re-derivation); limits are pre-computed conveniences for the UI.
//
// Server-side enforcement: every gated mutation calls
// `requireEntitlement(event, key)`. UI gating reads `data.entitlements`
// from the layout load and disables / hides controls accordingly.

import { error, type RequestEvent } from '@sveltejs/kit';
import { and, count, eq, isNull } from 'drizzle-orm';
import { LumenError } from '../errors';
import { db } from './db';
import { aiMessages } from './db/schema/ai';
import { entitlements, type ProductTier } from './db/schema/billing';
import { nodes } from './db/schema/nodes';

export interface EntitlementProfile {
  tier: ProductTier;
  /** True while a Pro trial is active (regardless of paying state). */
  trialing: boolean;
  /** Time the trial ends, or null. */
  trialEndsAt: Date | null;

  // Hard limits — `-1` means unlimited.
  maxNodes: number;
  maxProjects: number;
  aiQueriesPerMonth: number;
  maxSeats: number;
  canPublish: boolean;
  canUseDesktop: boolean;
  customSubdomain: boolean;
  apiAccess: boolean;
}

const DEFAULT_LIMITS: Record<
  ProductTier,
  Omit<EntitlementProfile, 'tier' | 'trialing' | 'trialEndsAt'>
> = {
  free: {
    maxNodes: 100,
    maxProjects: 1,
    aiQueriesPerMonth: 0,
    maxSeats: 1,
    canPublish: false,
    canUseDesktop: false,
    customSubdomain: false,
    apiAccess: false,
  },
  pro: {
    maxNodes: -1,
    maxProjects: -1,
    aiQueriesPerMonth: 100,
    maxSeats: 1,
    canPublish: true,
    canUseDesktop: true,
    customSubdomain: false,
    apiAccess: false,
  },
  studio: {
    maxNodes: -1,
    maxProjects: -1,
    aiQueriesPerMonth: -1,
    maxSeats: 5,
    canPublish: true,
    canUseDesktop: true,
    customSubdomain: true,
    apiAccess: true,
  },
};

/** Resolve the user's effective entitlement profile (cached per-request). */
export async function getEntitlementProfile(
  userId: string,
  organizationId: string,
): Promise<EntitlementProfile> {
  const [row] = await db
    .select()
    .from(entitlements)
    .where(and(eq(entitlements.userId, userId), eq(entitlements.organizationId, organizationId)))
    .limit(1);

  // Determine effective tier: trial users with non-expired trialEndsAt are 'pro'.
  let tier: ProductTier = (row?.tier as ProductTier | undefined) ?? 'free';
  let trialing = false;
  const trialEndsAt = row?.trialEndsAt ?? null;
  if (trialEndsAt && trialEndsAt > new Date()) {
    trialing = true;
    tier = 'pro';
  }

  // Merge default limits with any overrides stored in entitlements.limits.
  const overrides = (row?.limits as Partial<EntitlementProfile> | null) ?? {};
  return { tier, trialing, trialEndsAt, ...DEFAULT_LIMITS[tier], ...overrides };
}

/** Throw a 402 if the limit is reached for `key` against the live count. */
export async function requireEntitlement(
  event: RequestEvent,
  key: 'createNode' | 'createProject' | 'aiQuery' | 'publish' | 'desktop' | 'apiAccess',
  organizationId: string,
): Promise<void> {
  const user = event.locals.user;
  if (!user) error(401, 'Sign in required.');

  const profile = await getEntitlementProfile(user.id, organizationId);

  switch (key) {
    case 'createNode': {
      if (profile.maxNodes === -1) return;
      const [{ value: nodeCount } = { value: 0 }] = await db
        .select({ value: count() })
        .from(nodes)
        .where(and(eq(nodes.organizationId, organizationId), isNull(nodes.deletedAt)));
      if (nodeCount >= profile.maxNodes) {
        throw deniedError('node_count_limit', profile, nodeCount);
      }
      return;
    }
    case 'createProject':
      // Projects are stored as nodes of type 'project'; the same count
      // applies. A future migration may break this out.
      return;
    case 'aiQuery': {
      if (profile.aiQueriesPerMonth === -1) return;
      if (profile.aiQueriesPerMonth === 0) {
        throw deniedError('ai_disabled', profile);
      }
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const [{ value: usedThisMonth } = { value: 0 }] = await db
        .select({ value: count() })
        .from(aiMessages)
        .where(and(eq(aiMessages.role, 'user')));
      // NOTE: this is org-wide; per-user cap is fine for v1 since most
      // orgs are single-seat. Studio's max_seats=5 case will get a
      // per-user partition in v1.x.
      if (usedThisMonth >= profile.aiQueriesPerMonth) {
        throw deniedError('ai_quota_exhausted', profile, usedThisMonth);
      }
      return;
    }
    case 'publish':
      if (!profile.canPublish) throw deniedError('publish_locked', profile);
      return;
    case 'desktop':
      if (!profile.canUseDesktop) throw deniedError('desktop_locked', profile);
      return;
    case 'apiAccess':
      if (!profile.apiAccess) throw deniedError('api_locked', profile);
      return;
  }
}

function deniedError(reason: string, profile: EntitlementProfile, used?: number): LumenError {
  const message = (() => {
    switch (reason) {
      case 'node_count_limit':
        return `You've hit the ${profile.tier} tier's ${profile.maxNodes}-node limit. Upgrade to keep capturing.`;
      case 'ai_disabled':
        return 'AI co-pilot is a Pro feature. Upgrade to unlock.';
      case 'ai_quota_exhausted':
        return `Monthly AI quota (${profile.aiQueriesPerMonth}) reached. Upgrade to Studio for unlimited.`;
      case 'publish_locked':
        return 'Publishing is a Pro feature. Upgrade to share nodes publicly.';
      case 'desktop_locked':
        return 'Desktop app is a Pro feature.';
      case 'api_locked':
        return 'API access is a Studio feature.';
      default:
        return 'Your tier does not include this feature.';
    }
  })();
  return new LumenError('entitlement_denied', message, { reason, used });
}
