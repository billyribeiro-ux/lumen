import { describe, expect, it } from 'vitest';
import { outranks } from './rbac';

describe('outranks', () => {
  it('owner outranks admin/editor/viewer', () => {
    expect(outranks('owner', 'admin')).toBe(true);
    expect(outranks('owner', 'editor')).toBe(true);
    expect(outranks('owner', 'viewer')).toBe(true);
  });
  it('admin outranks editor/viewer but not owner', () => {
    expect(outranks('admin', 'editor')).toBe(true);
    expect(outranks('admin', 'viewer')).toBe(true);
    expect(outranks('admin', 'owner')).toBe(false);
  });
  it('viewer outranks none', () => {
    expect(outranks('viewer', 'admin')).toBe(false);
    expect(outranks('viewer', 'editor')).toBe(false);
    expect(outranks('viewer', 'viewer')).toBe(false);
  });
});
