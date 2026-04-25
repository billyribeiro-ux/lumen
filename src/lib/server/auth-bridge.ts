// Helpers that bridge Better Auth's Response objects to SvelteKit's
// RequestEvent — specifically, copying the Set-Cookie headers Better
// Auth emits onto the SvelteKit response so form actions can sign
// users in and out without manual cookie shuffling.

import type { RequestEvent } from '@sveltejs/kit';

/**
 * Copy every Set-Cookie header from `response` onto the SvelteKit event,
 * using the framework's `cookies.set()` so cookies are correctly applied
 * to the eventual response (including any redirect).
 */
export function copyAuthCookies(response: Response, event: RequestEvent): void {
  // `getSetCookie()` returns each cookie as its own string in modern Node /
  // browser fetch. Fall back to the raw header for older runtimes.
  const setCookies =
    'getSetCookie' in response.headers && typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : (response.headers.get('set-cookie')?.split(/,(?=\s*[A-Za-z0-9_-]+=)/g) ?? []);

  for (const raw of setCookies) {
    const parsed = parseSetCookie(raw);
    if (!parsed) continue;
    event.cookies.set(parsed.name, parsed.value, parsed.options);
  }
}

interface ParsedCookie {
  name: string;
  value: string;
  options: {
    path: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'lax' | 'strict' | 'none';
    maxAge?: number;
    expires?: Date;
    domain?: string;
  };
}

function parseSetCookie(header: string): ParsedCookie | null {
  const parts = header.split(';').map((p) => p.trim());
  const first = parts.shift();
  if (!first) return null;
  const eq = first.indexOf('=');
  if (eq === -1) return null;
  const name = first.slice(0, eq).trim();
  const value = decodeURIComponent(first.slice(eq + 1));

  const options: ParsedCookie['options'] = { path: '/' };
  for (const attr of parts) {
    const [rawKey, ...rest] = attr.split('=');
    const key = rawKey?.trim().toLowerCase();
    const val = rest.join('=').trim();
    switch (key) {
      case 'path':
        options.path = val || '/';
        break;
      case 'domain':
        options.domain = val;
        break;
      case 'expires':
        options.expires = new Date(val);
        break;
      case 'max-age':
        options.maxAge = Number(val);
        break;
      case 'httponly':
        options.httpOnly = true;
        break;
      case 'secure':
        options.secure = true;
        break;
      case 'samesite':
        if (val === 'Lax' || val === 'lax') options.sameSite = 'lax';
        else if (val === 'Strict' || val === 'strict') options.sameSite = 'strict';
        else if (val === 'None' || val === 'none') options.sameSite = 'none';
        break;
    }
  }

  return { name, value, options };
}
