// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { AuthSession } from '$lib/server/auth';

declare global {
  namespace App {
    interface Error {
      message: string;
      errorId?: string;
    }
    interface Locals {
      session: NonNullable<AuthSession>['session'] | null;
      user: NonNullable<AuthSession>['user'] | null;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}
