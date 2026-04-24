import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { copyAuthCookies } from '$lib/server/auth-bridge';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
  if (locals.user) throw redirect(303, '/');
  return {};
};

export const actions: Actions = {
  default: async (event) => {
    const data = await event.request.formData();
    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');

    if (!name || !email || !password) {
      return fail(400, { name, email, message: 'All fields are required.' });
    }
    if (password.length < 12) {
      return fail(400, { name, email, message: 'Password must be at least 12 characters.' });
    }

    let response: Response;
    try {
      response = await auth.api.signUpEmail({
        body: { name, email, password, callbackURL: '/' },
        headers: event.request.headers,
        asResponse: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-up failed.';
      return fail(400, { name, email, message });
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}) as { message?: string });
      return fail(response.status, {
        name,
        email,
        message: body.message ?? 'Sign-up failed.',
      });
    }

    copyAuthCookies(response, event);
    throw redirect(303, '/verify-email?sent=1');
  },
};
