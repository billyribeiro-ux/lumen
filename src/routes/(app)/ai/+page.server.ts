import { listConversations } from '$lib/server/ai';
import { isAiConfigured } from '$lib/server/ai/client';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const layout = await parent();
  const conversations = layout.user ? await listConversations(layout.user.id, 20) : [];

  return {
    conversations,
    aiConfigured: isAiConfigured(),
  };
};
