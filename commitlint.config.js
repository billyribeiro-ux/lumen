// Lumen commitlint config — Conventional Commits enforcement.
// Scopes mirror CONTRIBUTING.md and the PE7 14-phase build chain.
// See ADR-009 / ADR-010 / CONTRIBUTING.md.

/** @type {import('@commitlint/types').UserConfig} */
const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'chore', 'refactor', 'perf', 'test', 'style', 'build', 'ci', 'revert'],
    ],
    'scope-enum': [
      2,
      'always',
      [
        // Phase 1+ domain scopes
        'auth',
        'db',
        'schema',
        'seed',
        'rbac',
        'validation',
        'crud',
        'email',
        'billing',
        'stripe',
        'checkout',
        'portal',
        'entitlements',
        'ui',
        'editor',
        'graph',
        'command-bar',
        'ai',
        'desktop',
        'tauri',
        'ci',
        'deploy',
        'docs',
        'test',
        // Phase 0 / meta scopes also in use
        'adr',
        'log',
        'handoff',
        'scaffold',
        'release',
      ],
    ],
    'subject-case': [0],
    'subject-max-length': [2, 'always', 100],
    'body-max-line-length': [1, 'always', 100],
    'footer-leading-blank': [1, 'always'],
  },
};

export default config;
