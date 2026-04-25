import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import {
  createLinkSchema,
  createNodeSchema,
  emailSchema,
  signInSchema,
  slugSchema,
} from './schemas';

describe('emailSchema', () => {
  it('accepts a valid email and lowercases it', () => {
    const out = v.parse(emailSchema, '  Billy@Lumen.SO  ');
    expect(out).toBe('billy@lumen.so');
  });

  it('rejects an invalid email', () => {
    expect(() => v.parse(emailSchema, 'not-an-email')).toThrow();
  });
});

describe('slugSchema', () => {
  it('rejects uppercase and underscores', () => {
    expect(() => v.parse(slugSchema, 'My_Slug')).toThrow();
    expect(() => v.parse(slugSchema, 'MySlug')).toThrow();
  });

  it('accepts kebab-case', () => {
    expect(v.parse(slugSchema, 'good-slug-1')).toBe('good-slug-1');
  });
});

describe('signInSchema', () => {
  it('requires email + password', () => {
    expect(() => v.parse(signInSchema, { email: 'a@b.co', password: 'short' })).toThrow();
    expect(() =>
      v.parse(signInSchema, { email: 'a@b.co', password: 'longenoughpw12' }),
    ).not.toThrow();
  });
});

describe('createNodeSchema', () => {
  it('accepts a minimal valid payload', () => {
    const out = v.parse(createNodeSchema, {
      organizationId: '11111111-1111-1111-1111-111111111111',
      type: 'note',
      title: 'Hello',
    });
    expect(out.title).toBe('Hello');
  });

  it('rejects unknown types', () => {
    expect(() =>
      v.parse(createNodeSchema, {
        organizationId: '11111111-1111-1111-1111-111111111111',
        type: 'tweet',
        title: 'no',
      }),
    ).toThrow();
  });
});

describe('createLinkSchema', () => {
  it('rejects self-links', () => {
    const id = '11111111-1111-1111-1111-111111111111';
    expect(() => v.parse(createLinkSchema, { sourceNodeId: id, targetNodeId: id })).toThrow();
  });
});
