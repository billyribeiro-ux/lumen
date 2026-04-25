import { fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { isLumenError } from '$lib/errors';
import { audit } from '$lib/server/audit';
import { requirePermissionFor } from '$lib/server/auth-helpers';
import { requireEntitlement } from '$lib/server/entitlements';
import { createNode } from '$lib/server/nodes';
import { createNodeSchema } from '$lib/validation/schemas';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { activeOrgId } = await parent();
  return { activeOrgId };
};

export const actions: Actions = {
  default: async (event) => {
    const data = await event.request.formData();
    const tagsRaw = String(data.get('tags') ?? '');
    const input = {
      organizationId: String(data.get('organizationId') ?? ''),
      type: data.get('type'),
      title: String(data.get('title') ?? ''),
      body: String(data.get('body') ?? ''),
      tags: tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };

    const parsed = v.safeParse(createNodeSchema, input);
    if (!parsed.success) {
      return fail(400, { input, message: parsed.issues[0]?.message ?? 'Invalid input.' });
    }

    const { user } = await requirePermissionFor(event, 'node.create', parsed.output.organizationId);

    try {
      await requireEntitlement(event, 'createNode', parsed.output.organizationId);
    } catch (err) {
      if (isLumenError(err)) return fail(402, { input, message: err.message });
      throw err;
    }

    const node = await createNode({
      organizationId: parsed.output.organizationId,
      authorId: user.id,
      type: parsed.output.type,
      title: parsed.output.title,
      body: parsed.output.body ?? '',
      ...(parsed.output.tags ? { tagNames: parsed.output.tags } : {}),
    });

    await audit(event, {
      action: 'node.create',
      resource: `node:${node.id}`,
      organizationId: node.organizationId,
      after: { id: node.id, slug: node.slug, type: node.type, title: node.title },
    });

    throw redirect(303, `/n/${node.slug}`);
  },
};
