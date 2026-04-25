import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
  const token = url.searchParams.get('token');
  return { token };
};

export const actions: Actions = {
  default: async (event) => {
    const data = await event.request.formData();
    const password = String(data.get('password') ?? '');
    const token = String(data.get('token') ?? '');

    if (!token) return fail(400, { message: 'Reset token missing.' });
    if (password.length < 12) {
      return fail(400, { message: 'Password must be at least 12 characters.' });
    }

    try {
      await auth.api.resetPassword({
        body: { newPassword: password, token },
        headers: event.request.headers,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Reset failed.';
      return fail(400, { message });
    }
    throw redirect(303, '/sign-in?reset=1');
  },
};
