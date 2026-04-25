import { error, json, type RequestHandler } from '@sveltejs/kit';
import * as v from 'valibot';
import { isLumenError } from '$lib/errors';
import { createConversation, sendMessage } from '$lib/server/ai';
import { isAiConfigured } from '$lib/server/ai/client';
import { audit } from '$lib/server/audit';
import { requireUser } from '$lib/server/auth-helpers';
import { requireEntitlement } from '$lib/server/entitlements';

const sendInput = v.object({
  conversationId: v.optional(v.string()),
  message: v.pipe(v.string(), v.minLength(1), v.maxLength(8000)),
});

export const POST: RequestHandler = async (event) => {
  if (!isAiConfigured()) error(503, 'AI co-pilot is not configured.');

  const user = requireUser(event);
  const orgId = event.cookies.get('lumen.org');
  if (!orgId) error(400, 'No active organization.');

  try {
    await requireEntitlement(event, 'aiQuery', orgId);
  } catch (err) {
    if (isLumenError(err))
      return json({ error: err.message, code: err.code }, { status: err.status });
    throw err;
  }

  const body = (await event.request.json().catch(() => ({}))) as unknown;
  const parsed = v.safeParse(sendInput, body);
  if (!parsed.success) {
    error(400, parsed.issues[0]?.message ?? 'Invalid input.');
  }

  let conversationId = parsed.output.conversationId;
  if (!conversationId) {
    const titleSeed = parsed.output.message.slice(0, 60).replace(/\s+/g, ' ').trim();
    const conv = await createConversation({
      userId: user.id,
      organizationId: orgId,
      title: titleSeed || 'New conversation',
    });
    conversationId = conv.id;
  }

  const result = await sendMessage({
    conversationId,
    userId: user.id,
    organizationId: orgId,
    content: parsed.output.message,
  });

  await audit(event, {
    action: 'ai.message.send',
    resource: `conversation:${conversationId}`,
    organizationId: orgId,
    after: {
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      citedSlugs: result.citedSlugs,
    },
  });

  return json({ conversationId, ...result });
};
