import { fail, redirect } from '@sveltejs/kit';
import { getAuth } from '$lib/server/auth';
import { copyAuthCookies } from '$lib/server/auth-bridge';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
  if (locals.user) throw redirect(303, '/');
  return {};
};

export const actions: Actions = {
  default: async (event) => {
    const data = await event.request.formData();
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');
    const callbackURL = String(data.get('callbackURL') ?? '/');

    if (!email || !password) {
      return fail(400, { email, message: 'Email and password are required.' });
    }

    let response: Response;
    try {
      response = await getAuth().api.signInEmail({
        body: { email, password, callbackURL },
        headers: event.request.headers,
        asResponse: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed.';
      return fail(401, { email, message });
    }

    if (!response.ok) {
      const message = await response
        .json()
        .then((body: { message?: string }) => body.message)
        .catch(() => undefined);
      return fail(response.status, { email, message: message ?? 'Sign-in failed.' });
    }

    copyAuthCookies(response, event);
    throw redirect(303, callbackURL);
  },
};
