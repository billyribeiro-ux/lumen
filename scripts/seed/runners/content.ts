// Sample content for seeded users — nodes, links, tags, daily notes,
// decisions, snippets, inbox items.
//
// Volume is deliberately small (~5 nodes per user) — the goal is
// "enough variety to exercise the UI in dev" not "production-shaped
// data". Add more later via dedicated benchmark fixtures.

import { eq } from 'drizzle-orm';
import { dailies } from '../../../src/lib/server/db/schema/dailies';
import { decisions } from '../../../src/lib/server/db/schema/decisions';
import { inboxItems } from '../../../src/lib/server/db/schema/inbox';
import { links } from '../../../src/lib/server/db/schema/links';
import { nodeContent, nodes, nodeVersions } from '../../../src/lib/server/db/schema/nodes';
import { snippets } from '../../../src/lib/server/db/schema/snippets';
import { nodeTags, tags } from '../../../src/lib/server/db/schema/tags';
import type { SeedDb } from '../connection';
import { isTrialOrg, USERS } from '../personas';
import type { SeededUsers } from './users';

interface NodeSeed {
  type: 'note' | 'task' | 'decision' | 'spec' | 'snippet' | 'link' | 'person' | 'project' | 'daily';
  slug: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}

const TAG_LIBRARY: Record<string, string[]> = {
  'lumen-labs': ['stack', 'pe7', 'auth', 'graph', 'launch'],
  'indie-studio': ['build-in-public', 'product', 'marketing'],
  'free-hacker': ['side-project', 'learning'],
};

const NODES_BY_OWNER_EMAIL: Record<string, NodeSeed[]> = {
  'billy@lumen.so': [
    {
      type: 'note',
      slug: 'pe7-build-rules',
      title: 'PE7 build discipline',
      body: '# PE7 build discipline\n\nSchema first. Seeding second. Auth third. Never skip phases.\n\nSee `docs/handoffs/2026-04-24-phase-0-handoff.md`.',
    },
    {
      type: 'task',
      slug: 'wire-better-auth',
      title: 'Wire Better Auth (Phase 3)',
      body: '- Configure passkeys, TOTP, OAuth Google + GitHub, magic links\n- Drizzle adapter pointing at `users`/`sessions`/`accounts`/`verification`\n- Cookie name: `lumen.session_token`',
      metadata: { dueAt: '2026-05-15', priority: 'p0' },
    },
    {
      type: 'decision',
      slug: 'biome-over-eslint-prettier',
      title: 'Adopt Biome over ESLint + Prettier',
      body: 'See ADR-010. Biome owns TS/JS/JSON/CSS; Prettier handles `*.svelte` only.',
      metadata: { decisionStatus: 'decided', adrRef: 'ADR-010' },
    },
    {
      type: 'snippet',
      slug: 'lumen-snake-case-helper',
      title: 'snake_case helper for column names',
      body: '```ts\nexport const snake = (s: string): string =>\n  s.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());\n```',
      metadata: { language: 'typescript' },
    },
  ],
  'sara@lumen.so': [
    {
      type: 'project',
      slug: 'launch-checklist',
      title: 'v1.0 launch checklist',
      body: '# Launch checklist\n\n- [ ] DNS\n- [ ] DMARC + SPF\n- [ ] Stripe live keys\n- [ ] Sentry alerting',
    },
    {
      type: 'task',
      slug: 'sentry-alert-tuning',
      title: 'Tune Sentry alert thresholds',
      body: 'Currently we get paged on every 5xx. Threshold: error.count > 50 / 5min, p95 > 1s.',
      metadata: { priority: 'p1' },
    },
  ],
  'marcus@lumen.so': [
    {
      type: 'spec',
      slug: 'graph-view-perf-budget',
      title: 'Graph view performance budget',
      body: '## Targets\n- 1k nodes at ≥30 FPS on Apple M2 base.\n- Initial render < 250ms.\n- Memory < 200MB after layout converges.',
    },
  ],
  'priya@lumen.so': [
    {
      type: 'note',
      slug: 'okclch-token-rationale',
      title: 'Why OKLCH for tokens',
      body: 'OKLCH gives perceptually uniform lightness, so adjusting `--color-text` predictably shifts contrast across themes without re-tuning every component.',
    },
  ],
  'james@lumen.so': [
    {
      type: 'note',
      slug: 'first-impressions',
      title: 'First impressions of the command bar',
      body: 'The ⌘K bar feels Raycast-tier already. The `>` prefix for commands is intuitive. Suggestion: render keybindings on the right.',
    },
  ],
  'anna@indie.studio': [
    {
      type: 'note',
      slug: 'launch-comms',
      title: 'Launch comms plan',
      body: 'Cross-post Twitter + Bluesky + LinkedIn. Lead with the AI co-pilot demo (⌘J). Keep video < 60s.',
    },
    {
      type: 'task',
      slug: 'shoot-demo-video',
      title: 'Shoot 60-second demo video',
      body: 'Storyboard: ⌘K → ⌘G → ⌘J → ⌘⇧P. Total: 4 hotkeys, 60 seconds, no voiceover.',
    },
  ],
  'tomas@indie.studio': [
    {
      type: 'snippet',
      slug: 'request-id-middleware',
      title: 'Request ID middleware',
      body: '```ts\nexport const requestId = (event: RequestEvent) => crypto.randomUUID();\n```',
      metadata: { language: 'typescript' },
    },
  ],
  'rachel@hacker.io': [
    {
      type: 'note',
      slug: 'free-tier-explore',
      title: 'Exploring the free tier',
      body: 'Stuck at 100 nodes. Considering Pro for the AI co-pilot.',
    },
  ],
};

export async function seedContent(db: SeedDb, ctx: SeededUsers): Promise<void> {
  // ── Tags ────────────────────────────────────────────────
  for (const [orgSlug, tagNames] of Object.entries(TAG_LIBRARY)) {
    const organizationId = ctx.orgIdBySlug.get(orgSlug);
    if (!organizationId) continue;
    for (const name of tagNames) {
      const existing = await db
        .select({ id: tags.id })
        .from(tags)
        .where(eq(tags.name, name))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(tags).values({ organizationId, name });
      }
    }
  }

  // ── Nodes (+ content + initial version) ─────────────────
  for (const [email, nodeSeeds] of Object.entries(NODES_BY_OWNER_EMAIL)) {
    const authorId = ctx.userIdByEmail.get(email);
    const userFixture = USERS.find((u) => u.email === email);
    if (!authorId || !userFixture) continue;
    const organizationId = ctx.orgIdBySlug.get(userFixture.orgSlug);
    if (!organizationId) continue;

    for (const seed of nodeSeeds) {
      const existing = await db
        .select({ id: nodes.id })
        .from(nodes)
        .where(eq(nodes.slug, seed.slug))
        .limit(1);
      if (existing.length > 0) continue;

      const [inserted] = await db
        .insert(nodes)
        .values({
          organizationId,
          authorId,
          type: seed.type,
          status: 'active',
          title: seed.title,
          slug: seed.slug,
          metadata: seed.metadata ?? {},
        })
        .returning({ id: nodes.id });
      if (!inserted) continue;

      const [version] = await db
        .insert(nodeVersions)
        .values({
          nodeId: inserted.id,
          version: 1,
          body: seed.body,
          authorId,
          note: 'Initial seed version.',
        })
        .returning({ id: nodeVersions.id });

      await db.insert(nodeContent).values({
        nodeId: inserted.id,
        currentVersionId: version?.id ?? null,
        body: seed.body,
        bodyFormat: 'markdown',
      });

      // Satellite tables for type-specific structure.
      if (seed.type === 'decision') {
        await db.insert(decisions).values({
          nodeId: inserted.id,
          context: 'Recorded during Lumen Phase 0 documentation work.',
          options: [],
          decision: seed.body,
          consequences: 'See linked ADR for full consequences.',
        });
      } else if (seed.type === 'snippet') {
        await db.insert(snippets).values({
          nodeId: inserted.id,
          language: (seed.metadata?.['language'] as string | undefined) ?? 'plaintext',
          code: seed.body,
        });
      }
    }
  }

  // ── Daily notes for the past 3 days, owners only ────────
  const now = new Date();
  const ownerEmails = USERS.filter((u) => u.isOrgOwner && !isTrialOrg(u.orgSlug)).map(
    (u) => u.email,
  );
  for (const email of ownerEmails) {
    const userId = ctx.userIdByEmail.get(email);
    const userFixture = USERS.find((u) => u.email === email);
    if (!userId || !userFixture) continue;
    const organizationId = ctx.orgIdBySlug.get(userFixture.orgSlug);
    if (!organizationId) continue;
    for (let dayOffset = 0; dayOffset < 3; dayOffset += 1) {
      const date = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      const isoDate = date.toISOString().slice(0, 10);
      const slug = `daily-${email.split('@')[0]}-${isoDate}`;
      const existing = await db
        .select({ id: nodes.id })
        .from(nodes)
        .where(eq(nodes.slug, slug))
        .limit(1);
      if (existing.length > 0) continue;
      const [node] = await db
        .insert(nodes)
        .values({
          organizationId,
          authorId: userId,
          type: 'daily',
          status: 'active',
          title: `Daily — ${isoDate}`,
          slug,
          metadata: { dailyDate: isoDate },
        })
        .returning({ id: nodes.id });
      if (!node) continue;
      await db.insert(dailies).values({
        nodeId: node.id,
        userId,
        dailyDate: isoDate,
      });
    }
  }

  // ── Inbox items — a few unprocessed captures per Lumen Labs user ──
  const labsUsers = USERS.filter((u) => u.orgSlug === 'lumen-labs');
  for (const u of labsUsers) {
    const userId = ctx.userIdByEmail.get(u.email);
    const organizationId = ctx.orgIdBySlug.get(u.orgSlug);
    if (!userId || !organizationId) continue;
    const existing = await db
      .select({ id: inboxItems.id })
      .from(inboxItems)
      .where(eq(inboxItems.userId, userId))
      .limit(1);
    if (existing.length > 0) continue;
    await db.insert(inboxItems).values([
      {
        organizationId,
        userId,
        body: 'Read the new Drizzle 1.0 release notes.',
        source: 'web_quick_capture',
        status: 'pending',
      },
      {
        organizationId,
        userId,
        body: 'Idea: compute backlinks via materialized view if reverse-query gets slow.',
        source: 'desktop_global_hotkey',
        status: 'pending',
      },
    ]);
  }

  // ── A handful of links between seeded nodes (within Lumen Labs) ──
  const linkPairs: Array<{ from: string; to: string; type: 'references' | 'derives_from' }> = [
    { from: 'wire-better-auth', to: 'pe7-build-rules', type: 'derives_from' },
    { from: 'biome-over-eslint-prettier', to: 'pe7-build-rules', type: 'references' },
    { from: 'graph-view-perf-budget', to: 'pe7-build-rules', type: 'references' },
  ];
  for (const pair of linkPairs) {
    const [source] = await db
      .select({ id: nodes.id })
      .from(nodes)
      .where(eq(nodes.slug, pair.from))
      .limit(1);
    const [target] = await db
      .select({ id: nodes.id })
      .from(nodes)
      .where(eq(nodes.slug, pair.to))
      .limit(1);
    if (!source || !target) continue;
    const existing = await db
      .select({ id: links.id })
      .from(links)
      .where(eq(links.sourceNodeId, source.id))
      .limit(1);
    if (existing.length > 0) continue;
    await db.insert(links).values({
      sourceNodeId: source.id,
      targetNodeId: target.id,
      relationType: pair.type,
    });
  }

  // ── Tag a few nodes for variety ─────────────────────────
  const taggings: Array<{ nodeSlug: string; tagName: string }> = [
    { nodeSlug: 'pe7-build-rules', tagName: 'pe7' },
    { nodeSlug: 'wire-better-auth', tagName: 'auth' },
    { nodeSlug: 'biome-over-eslint-prettier', tagName: 'stack' },
    { nodeSlug: 'graph-view-perf-budget', tagName: 'graph' },
    { nodeSlug: 'launch-comms', tagName: 'marketing' },
    { nodeSlug: 'shoot-demo-video', tagName: 'product' },
  ];
  for (const t of taggings) {
    const [node] = await db
      .select({ id: nodes.id })
      .from(nodes)
      .where(eq(nodes.slug, t.nodeSlug))
      .limit(1);
    const [tag] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.name, t.tagName))
      .limit(1);
    if (!node || !tag) continue;
    const existing = await db
      .select({ id: nodeTags.id })
      .from(nodeTags)
      .where(eq(nodeTags.nodeId, node.id))
      .limit(1);
    if (existing.length > 0) continue;
    await db.insert(nodeTags).values({ nodeId: node.id, tagId: tag.id });
  }
}

// Re-export for wipe.
export {
  dailies,
  decisions,
  inboxItems,
  links,
  nodeContent,
  nodes,
  nodeTags,
  nodeVersions,
  snippets,
  tags,
};
