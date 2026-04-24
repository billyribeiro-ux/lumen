import { fail } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async (event) => {
    const data = await event.request.formData();
    const email = String(data.get('email') ?? '').trim();
    if (!email) return fail(400, { email, message: 'Email is required.' });

    try {
      await auth.api.requestPasswordReset({
        body: { email, redirectTo: '/reset-password' },
        headers: event.request.headers,
      });
    } catch {
      // Always return success — never leak whether an email exists.
    }
    return { email, sent: true };
  },
};
