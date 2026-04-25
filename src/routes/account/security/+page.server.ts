import { redirect } from '@sveltejs/kit';
import { getAuth } from '$lib/server/auth';
import { copyAuthCookies } from '$lib/server/auth-bridge';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  if (!event.locals.user) throw redirect(303, '/sign-in?next=/account/security');

  const auth = getAuth();
  const sessions = await auth.api
    .listSessions({ headers: event.request.headers })
    .catch(() => [] as Array<unknown>);
  const passkeys = await auth.api
    .listPasskeys({ headers: event.request.headers })
    .catch(() => [] as Array<unknown>);

  return {
    user: event.locals.user,
    sessions,
    passkeys,
    twoFactorEnabled: event.locals.user.twoFactorEnabled ?? false,
  };
};

export const actions: Actions = {
  signOutEverywhere: async (event) => {
    const response = await getAuth().api.revokeOtherSessions({
      headers: event.request.headers,
      asResponse: true,
    });
    copyAuthCookies(response, event);
    return { ok: true };
  },
};
