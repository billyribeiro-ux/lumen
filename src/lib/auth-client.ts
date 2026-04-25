// Browser-side Better Auth client. Used by sign-in / sign-up forms via
// progressive enhancement (forms work without JS; client adds passkey
// + magic-link sugar).
//
// Server-only state lives in $lib/server/auth.ts and is never imported
// from a .svelte file.

import { passkeyClient } from '@better-auth/passkey/client';
import { magicLinkClient, twoFactorClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/svelte';

export const authClient = createAuthClient({
  plugins: [passkeyClient(), magicLinkClient(), twoFactorClient()],
});

// Convenient short-form references the views can use directly.
export const { signIn, signUp, signOut, useSession } = authClient;
