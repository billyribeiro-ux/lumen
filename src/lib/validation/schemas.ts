// Lumen shared Valibot schemas — used across forms, remote functions,
// and webhook bodies (ADR-005). Schemas defined here are usable on both
// client and server (no async refinements). Server-only refinements
// that need DB lookups (uniqueness checks etc) live next to their handlers.

import * as v from 'valibot';

// ── Primitives ────────────────────────────────────────────────────

export const uuidSchema = v.pipe(v.string('UUID required.'), v.uuid('Must be a valid UUID.'));

export const emailSchema = v.pipe(
  v.string('Email required.'),
  v.trim(),
  v.toLowerCase(),
  v.email('Must be a valid email.'),
  v.maxLength(254, 'Email is too long.'),
);

export const passwordSchema = v.pipe(
  v.string('Password required.'),
  v.minLength(12, 'Password must be at least 12 characters.'),
  v.maxLength(256, 'Password is too long.'),
);

export const slugSchema = v.pipe(
  v.string(),
  v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens only.'),
  v.minLength(2, 'Slug must be at least 2 characters.'),
  v.maxLength(64, 'Slug must be at most 64 characters.'),
);

export const oklchColorSchema = v.pipe(
  v.string(),
  // Permissive OKLCH literal: oklch(L C H [/ A]) with numeric values.
  v.regex(
    /^oklch\(\s*[\d.]+%?\s+[\d.]+\s+[\d.]+(\s*\/\s*[\d.]+%?)?\s*\)$/i,
    'Must be a valid oklch() color.',
  ),
);

// ── Auth ──────────────────────────────────────────────────────────

export const signInSchema = v.object({
  email: emailSchema,
  password: passwordSchema,
  callbackURL: v.optional(v.string()),
});

export const signUpSchema = v.object({
  name: v.pipe(
    v.string('Name required.'),
    v.trim(),
    v.minLength(1, 'Name required.'),
    v.maxLength(80, 'Name is too long.'),
  ),
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = v.object({
  email: emailSchema,
});

export const resetPasswordSchema = v.object({
  token: v.pipe(v.string(), v.minLength(8)),
  password: passwordSchema,
});

// ── Organizations + invitations ───────────────────────────────────

export const roleSchema = v.picklist(['owner', 'admin', 'editor', 'viewer'] as const);

export const inviteMemberSchema = v.object({
  organizationId: uuidSchema,
  email: emailSchema,
  role: v.picklist(['admin', 'editor', 'viewer'] as const),
});

export const updateOrganizationSchema = v.object({
  organizationId: uuidSchema,
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120)),
  slug: slugSchema,
  description: v.optional(v.pipe(v.string(), v.maxLength(2000))),
});

// ── Nodes ─────────────────────────────────────────────────────────

export const nodeTypeSchema = v.picklist([
  'note',
  'task',
  'decision',
  'spec',
  'snippet',
  'link',
  'person',
  'project',
  'daily',
] as const);

export const createNodeSchema = v.object({
  organizationId: uuidSchema,
  type: nodeTypeSchema,
  title: v.pipe(v.string(), v.trim(), v.minLength(1, 'Title required.'), v.maxLength(280)),
  slug: v.optional(slugSchema),
  body: v.optional(v.pipe(v.string(), v.maxLength(1_000_000))),
  metadata: v.optional(v.record(v.string(), v.unknown())),
  tags: v.optional(v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(48)))),
});

export const updateNodeSchema = v.object({
  id: uuidSchema,
  title: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(280))),
  body: v.optional(v.pipe(v.string(), v.maxLength(1_000_000))),
  status: v.optional(
    v.picklist([
      'draft',
      'active',
      'archived',
      'done',
      'cancelled',
      'decided',
      'superseded',
    ] as const),
  ),
  metadata: v.optional(v.record(v.string(), v.unknown())),
  versionNote: v.optional(v.pipe(v.string(), v.maxLength(280))),
});

// ── Links + tags ──────────────────────────────────────────────────

export const relationTypeSchema = v.picklist([
  'references',
  'blocks',
  'related',
  'supersedes',
  'derives_from',
  'embeds',
] as const);

export const createLinkSchema = v.pipe(
  v.object({
    sourceNodeId: uuidSchema,
    targetNodeId: uuidSchema,
    relationType: v.optional(relationTypeSchema, 'references'),
    label: v.optional(v.pipe(v.string(), v.maxLength(120))),
  }),
  v.check((input) => input.sourceNodeId !== input.targetNodeId, 'A node cannot link to itself.'),
);

export const tagSchema = v.object({
  organizationId: uuidSchema,
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(48)),
  color: v.optional(oklchColorSchema),
  description: v.optional(v.pipe(v.string(), v.maxLength(280))),
});

// ── Inbox ─────────────────────────────────────────────────────────

export const captureInboxSchema = v.object({
  organizationId: uuidSchema,
  body: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(10_000)),
  source: v.picklist([
    'web_quick_capture',
    'desktop_global_hotkey',
    'mobile_share',
    'email_in',
    'api',
  ] as const),
  sourceUrl: v.optional(v.pipe(v.string(), v.url())),
  captureToken: v.optional(v.pipe(v.string(), v.maxLength(128))),
});

// ── Inferred types ────────────────────────────────────────────────

export type SignInInput = v.InferOutput<typeof signInSchema>;
export type SignUpInput = v.InferOutput<typeof signUpSchema>;
export type CreateNodeInput = v.InferOutput<typeof createNodeSchema>;
export type UpdateNodeInput = v.InferOutput<typeof updateNodeSchema>;
export type CreateLinkInput = v.InferOutput<typeof createLinkSchema>;
export type InviteMemberInput = v.InferOutput<typeof inviteMemberSchema>;
export type CaptureInboxInput = v.InferOutput<typeof captureInboxSchema>;
