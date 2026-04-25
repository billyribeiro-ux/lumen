import { describe, expect, it } from 'vitest';
import { flattenValibotIssues, isLumenError, LumenError } from './errors';

describe('LumenError', () => {
  it('maps codes to HTTP statuses', () => {
    expect(new LumenError('validation_failed', 'x').status).toBe(400);
    expect(new LumenError('unauthenticated', 'x').status).toBe(401);
    expect(new LumenError('forbidden', 'x').status).toBe(403);
    expect(new LumenError('rate_limited', 'x').status).toBe(429);
    expect(new LumenError('entitlement_denied', 'x').status).toBe(402);
  });

  it('isLumenError narrows correctly', () => {
    const err: unknown = new LumenError('not_found', 'gone');
    expect(isLumenError(err)).toBe(true);
    expect(isLumenError(new Error('plain'))).toBe(false);
    expect(isLumenError(null)).toBe(false);
  });

  it('preserves detail context', () => {
    const err = new LumenError('conflict', 'duplicate', { resource: 'node:abc' });
    expect(err.detail).toEqual({ resource: 'node:abc' });
  });
});

describe('flattenValibotIssues', () => {
  it('flattens to a path → message map and keeps the first issue per path', () => {
    const issues = [
      { path: [{ key: 'email' }], message: 'required' },
      { path: [{ key: 'email' }], message: 'invalid' }, // ignored
      { path: [{ key: 'password' }], message: 'too short' },
    ];
    const flat = flattenValibotIssues(issues);
    expect(flat).toEqual({
      email: 'required',
      password: 'too short',
    });
  });

  it('handles missing paths', () => {
    const flat = flattenValibotIssues([{ message: 'top-level' }]);
    expect(flat).toEqual({ '': 'top-level' });
  });
});
