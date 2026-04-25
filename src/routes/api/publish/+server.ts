// POST /api/publish  — publish a node
// DELETE /api/publish  — unpublish (body: { nodeId })

import { error, json, type RequestHandler } from '@sveltejs/kit';
import * as v from 'valibot';
import { isLumenError } from '$lib/errors';
import { audit } from '$lib/server/audit';
import { requirePermissionFor } from '$lib/server/auth-helpers';
import { requireEntitlement } from '$lib/server/entitlements';
import { publish, unpublish } from '$lib/server/publishing';
import { slugSchema, uuidSchema } from '$lib/validation/schemas';

const publishSchema = v.object({
  nodeId: uuidSchema,
  organizationId: uuidSchema,
  pathSlug: slugSchema,
  subdomain: v.optional(slugSchema),
  commentsEnabled: v.optional(v.boolean()),
});

export const POST: RequestHandler = async (event) => {
  const body = await event.request.json().catch(() => ({}));
  const parsed = v.safeParse(publishSchema, body);
  if (!parsed.success) error(400, parsed.issues[0]?.message ?? 'Invalid input.');

  const { user } = await requirePermissionFor(event, 'node.publish', parsed.output.organizationId);

  try {
    await requireEntitlement(event, 'publish', parsed.output.organizationId);
  } catch (err) {
    if (isLumenError(err)) return json({ error: err.message }, { status: err.status });
    throw err;
  }

  // Custom subdomains are Studio-only.
  if (parsed.output.subdomain) {
    try {
      await requireEntitlement(event, 'apiAccess', parsed.output.organizationId);
    } catch (err) {
      if (isLumenError(err))
        return json({ error: 'Custom subdomains require Studio.' }, { status: err.status });
      throw err;
    }
  }

  const row = await publish({
    nodeId: parsed.output.nodeId,
    organizationId: parsed.output.organizationId,
    publishedById: user.id,
    pathSlug: parsed.output.pathSlug,
    ...(parsed.output.subdomain ? { subdomain: parsed.output.subdomain } : {}),
    ...(parsed.output.commentsEnabled !== undefined
      ? { commentsEnabled: parsed.output.commentsEnabled }
      : {}),
  });

  await audit(event, {
    action: 'node.publish',
    resource: `node:${parsed.output.nodeId}`,
    organizationId: parsed.output.organizationId,
    after: { pathSlug: row.pathSlug, subdomain: row.subdomain },
  });

  const url = parsed.output.subdomain
    ? `https://${parsed.output.subdomain}.lumen.so/p/${row.pathSlug}`
    : `https://lumen.so/p/${row.pathSlug}`;
  return json({ url, publication: row });
};

const unpublishSchema = v.object({
  nodeId: uuidSchema,
  organizationId: uuidSchema,
});

export const DELETE: RequestHandler = async (event) => {
  const body = await event.request.json().catch(() => ({}));
  const parsed = v.safeParse(unpublishSchema, body);
  if (!parsed.success) error(400, 'Invalid input.');

  await requirePermissionFor(event, 'node.publish', parsed.output.organizationId);
  await unpublish(parsed.output.nodeId, parsed.output.organizationId);

  await audit(event, {
    action: 'node.unpublish',
    resource: `node:${parsed.output.nodeId}`,
    organizationId: parsed.output.organizationId,
  });
  return json({ ok: true });
};
