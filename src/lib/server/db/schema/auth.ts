// Auth schema — Better Auth shape (ADR-004).
//
// These four tables are owned by us via Drizzle migrations, not by
// Better Auth's CLI. Field names match Better Auth's expected schema
// so the drizzleAdapter's default mapping works without overrides.
//
// Tables: users, sessions, accounts, verification.

import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { auditTimestamps, idColumn } from './_columns';

export const users = pgTable(
  'users',
  {
    id: idColumn(),
    email: text('email').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    name: text('name').notNull(),
    image: text('image'),
    // Two-factor authentication state
    twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
    // Last successful auth event — useful for "you signed in from a new device" emails
    lastSignInAt: timestamp('last_sign_in_at', { withTimezone: true, mode: 'date' }),
    ...auditTimestamps(),
  },
  (table) => [uniqueIndex('users_email_unique').on(table.email)],
);

export const sessions = pgTable(
  'sessions',
  {
    id: idColumn(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    ...auditTimestamps(),
  },
  (table) => [
    uniqueIndex('sessions_token_unique').on(table.token),
    index('sessions_user_id_idx').on(table.userId),
    index('sessions_expires_at_idx').on(table.expiresAt),
  ],
);

export const accounts = pgTable(
  'accounts',
  {
    id: idColumn(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Provider (google, github, credential, passkey, ...)
    providerId: text('provider_id').notNull(),
    // Provider-side account identifier (sub, email, credential id, ...)
    accountId: text('account_id').notNull(),
    // OAuth tokens — encrypted at rest at the application layer.
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true,
      mode: 'date',
    }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      withTimezone: true,
      mode: 'date',
    }),
    scope: text('scope'),
    idToken: text('id_token'),
    // Argon2id hash for credential providers; null for OAuth/passkey.
    password: text('password'),
    ...auditTimestamps(),
  },
  (table) => [
    uniqueIndex('accounts_provider_account_unique').on(table.providerId, table.accountId),
    index('accounts_user_id_idx').on(table.userId),
  ],
);

export const verification = pgTable(
  'verification',
  {
    id: idColumn(),
    // Email or phone or WebAuthn challenge target
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    ...auditTimestamps(),
  },
  (table) => [
    index('verification_identifier_idx').on(table.identifier),
    index('verification_expires_at_idx').on(table.expiresAt),
  ],
);
