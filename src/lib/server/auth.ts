// Lumen authentication — Better Auth 1.6 with Drizzle adapter.
//
// Plugins enabled:
//   - passkey       (@better-auth/passkey) WebAuthn registration + sign-in
//   - twoFactor     TOTP + backup codes
//   - magicLink     email-delivered one-time link
//   - socialProviders Google + GitHub OAuth
//
// Argon2id parameters per ADR-004 (OWASP 2024).
// Cookie name: lumen.session_token. HttpOnly + Secure + SameSite=Lax.
//
// Email delivery is stubbed to console in dev; Phase 7 wires Resend.

import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink, twoFactor } from 'better-auth/plugins';
import { db } from './db';
import {
  accounts,
  passkeys,
  sessions,
  twoFactor as twoFactorTable,
  users,
  verification,
} from './db/schema/auth';

const env = (key: string): string | undefined => process.env[key];

const required = (key: string, fallback?: string): string => {
  const value = env(key) ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

// In dev we tolerate missing OAuth keys — Better Auth simply won't
// register those routes. In production, the deploy must provide them.
const isProduction = env('NODE_ENV') === 'production';

const googleClientId = env('GOOGLE_CLIENT_ID');
const googleClientSecret = env('GOOGLE_CLIENT_SECRET');
const githubClientId = env('GITHUB_CLIENT_ID');
const githubClientSecret = env('GITHUB_CLIENT_SECRET');

if (isProduction) {
  if (!googleClientId || !googleClientSecret) {
    throw new Error('Production requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
  }
  if (!githubClientId || !githubClientSecret) {
    throw new Error('Production requires GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.');
  }
}

export const auth = betterAuth({
  appName: 'Lumen',
  baseURL: required('BETTER_AUTH_URL', 'http://localhost:5173'),
  secret: required('BETTER_AUTH_SECRET'),

  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification,
      passkey: passkeys,
      twoFactor: twoFactorTable,
    },
  }),

  // Cookies — server-rendered SvelteKit shares cookies on the apex
  // domain so subdomain publishing (Phase 18) works without per-domain
  // session re-issue.
  advanced: {
    cookiePrefix: 'lumen',
    cookies: {
      session_token: { name: 'session_token' },
    },
    cookieDomain: env('LUMEN_COOKIE_DOMAIN') ?? undefined,
    useSecureCookies: isProduction,
  },

  // Email + password auth.
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: isProduction,
    autoSignIn: true,
    minPasswordLength: 12,
    maxPasswordLength: 256,
    password: {
      hash: async (password) => {
        const { hash } = await import('@node-rs/argon2');
        return hash(password, {
          memoryCost: 19_456,
          timeCost: 2,
          parallelism: 1,
          outputLen: 32,
        });
      },
      verify: async ({ password, hash }) => {
        const { verify } = await import('@node-rs/argon2');
        return verify(hash, password);
      },
    },
    sendResetPassword: async ({ user, url }) => {
      // Phase 7 will swap this for a Resend-rendered Svelte email template.
      console.info(`[auth] Password reset for ${user.email}: ${url}`);
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      console.info(`[auth] Verify email for ${user.email}: ${url}`);
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24, // 24h
  },

  socialProviders: {
    ...(googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : {}),
    ...(githubClientId && githubClientSecret
      ? {
          github: {
            clientId: githubClientId,
            clientSecret: githubClientSecret,
          },
        }
      : {}),
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days, sliding
    updateAge: 60 * 60 * 24, // refresh every 24h
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 min in-process cache before re-validating
    },
  },

  rateLimit: {
    enabled: isProduction,
    window: 10,
    max: 100,
  },

  plugins: [
    twoFactor({
      issuer: 'Lumen',
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        console.info(`[auth] Magic link for ${email}: ${url}`);
      },
      expiresIn: 60 * 15, // 15 min
    }),
    passkey({
      rpName: 'Lumen',
      rpID: env('PUBLIC_LUMEN_RP_ID') ?? 'localhost',
      origin: env('BETTER_AUTH_URL') ?? 'http://localhost:5173',
    }),
  ],

  trustedOrigins: (env('LUMEN_TRUSTED_ORIGINS') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
});

export type Auth = typeof auth;
export type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;
