// Lumen error types — application-level errors that handlers can throw
// and route guards / form actions can pattern-match on.
//
// SvelteKit's `error()` is fine for HTTP-shaped failures; this module
// covers the cases that need richer context (validation, entitlement
// gating, idempotency replay, etc.).

export type LumenErrorCode =
  | 'validation_failed'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'gone'
  | 'rate_limited'
  | 'entitlement_denied'
  | 'webhook_replay'
  | 'integration_unavailable'
  | 'internal';

const CODE_TO_STATUS: Record<LumenErrorCode, number> = {
  validation_failed: 400,
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  gone: 410,
  rate_limited: 429,
  entitlement_denied: 402,
  webhook_replay: 200, // intentional: replay is a no-op success
  integration_unavailable: 503,
  internal: 500,
};

export class LumenError extends Error {
  readonly code: LumenErrorCode;
  readonly status: number;
  readonly detail: Record<string, unknown> | undefined;

  constructor(code: LumenErrorCode, message: string, detail?: Record<string, unknown>) {
    super(message);
    this.name = 'LumenError';
    this.code = code;
    this.status = CODE_TO_STATUS[code];
    this.detail = detail;
  }
}

export const isLumenError = (err: unknown): err is LumenError =>
  err instanceof Error && err.name === 'LumenError';

/** Convert a Valibot issue list into a flat field → message map. */
export function flattenValibotIssues(
  issues: ReadonlyArray<{ path?: ReadonlyArray<{ key?: string | number }>; message: string }>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const path = issue.path?.map((p) => String(p.key ?? '')).join('.') ?? '';
    if (!out[path]) out[path] = issue.message;
  }
  return out;
}
