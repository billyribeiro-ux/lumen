import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import * as v from 'valibot';
import { audit } from '$lib/server/audit';
import { requirePermissionFor } from '$lib/server/auth-helpers';
import { db } from '$lib/server/db';
import { nodes } from '$lib/server/db/schema/nodes';
import { backlinksFor, getNodeBySlug, softDeleteNode, updateNode } from '$lib/server/nodes';
import { updateNodeSchema } from '$lib/validation/schemas';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  const { activeOrgId } = await event.parent();
  if (!activeOrgId) error(404, 'Active organization not set.');

  const result = await getNodeBySlug(activeOrgId, event.params.slug);
  if (!result || !result.node || result.node.deletedAt) error(404, 'Node not found.');

  const backlinks = await backlinksFor(result.node.id);
  return { node: result.node, content: result.content, backlinks };
};

export const actions: Actions = {
  save: async (event) => {
    const data = await event.request.formData();
    const id = String(data.get('id') ?? '');
    const input = {
      id,
      title: String(data.get('title') ?? ''),
      body: String(data.get('body') ?? ''),
      versionNote: String(data.get('versionNote') ?? '') || undefined,
    };
    const parsed = v.safeParse(updateNodeSchema, input);
    if (!parsed.success) {
      return fail(400, { message: parsed.issues[0]?.message ?? 'Invalid input.' });
    }

    const [existing] = await db
      .select({ organizationId: nodes.organizationId })
      .from(nodes)
      .where(eq(nodes.id, id))
      .limit(1);
    if (!existing) error(404, 'Node not found.');

    const { user } = await requirePermissionFor(event, 'node.update', existing.organizationId);

    const updated = await updateNode({
      id,
      authorId: user.id,
      ...(parsed.output.title !== undefined ? { title: parsed.output.title } : {}),
      ...(parsed.output.body !== undefined ? { body: parsed.output.body } : {}),
      ...(parsed.output.versionNote !== undefined
        ? { versionNote: parsed.output.versionNote }
        : {}),
    });

    await audit(event, {
      action: 'node.update',
      resource: `node:${id}`,
      organizationId: existing.organizationId,
      after: updated ? { title: updated.title, status: updated.status } : null,
    });

    return { ok: true };
  },

  delete: async (event) => {
    const data = await event.request.formData();
    const id = String(data.get('id') ?? '');
    const [existing] = await db
      .select({ organizationId: nodes.organizationId, slug: nodes.slug })
      .from(nodes)
      .where(eq(nodes.id, id))
      .limit(1);
    if (!existing) error(404, 'Node not found.');

    await requirePermissionFor(event, 'node.delete', existing.organizationId);
    await softDeleteNode(id);

    await audit(event, {
      action: 'node.delete',
      resource: `node:${id}`,
      organizationId: existing.organizationId,
      before: { slug: existing.slug },
    });

    throw redirect(303, '/');
  },
};
