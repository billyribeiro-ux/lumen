# Contributing to Lumen

Thank you for your interest in contributing to Lumen. This document is the single source of truth for how work gets into this repository — standards, workflow, and expectations.

Lumen is built to **PE7 Architecture** standards: production-grade code, 10-year longevity, zero shortcuts. Every contribution must meet that bar.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Branch Strategy](#branch-strategy)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Documentation Requirements](#documentation-requirements)
- [Security](#security)
- [Release Process](#release-process)

---

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you agree to uphold it. See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

---

## Getting Started

### Prerequisites

| Tool     | Version     | Install                                   |
| -------- | ----------- | ----------------------------------------- |
| Node.js  | 22 LTS      | `brew install node@22` or [nodejs.org](https://nodejs.org) |
| pnpm     | 10.x        | `corepack enable` or `brew install pnpm`  |
| Git      | 2.40+       | `brew install git`                        |
| GitHub CLI | 2.x       | `brew install gh`                         |
| Rust     | 1.80+       | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` (for Tauri desktop) |

### Clone and Install

\`\`\`bash
git clone https://github.com/billyribeiro-ux/lumen.git
cd lumen
pnpm install
cp .env.example .env
# Fill in .env with your local development values
\`\`\`

### Run the Dev Server

\`\`\`bash
pnpm dev
\`\`\`

App runs at \`http://localhost:5173\`.

---

## Development Environment

### Required Editor Configuration

Lumen enforces Biome for linting and formatting. Install the Biome extension for your editor:

- **VS Code / Cursor / Windsurf:** `biomejs.biome`
- **JetBrains:** Biome plugin from the marketplace
- **Zed:** Built-in

Enable **format on save**. The repository's `biome.json` will be picked up automatically.

### Pre-commit Hooks

Lefthook runs automatically on every commit:

- Biome lint + format check
- TypeScript strict type check
- Commit message validation (Conventional Commits)
- Secret detection (gitleaks)

**Never bypass hooks.** If a hook fails, fix the underlying issue — do not run \`git commit --no-verify\`.

---

## Branch Strategy

Lumen uses a **trunk-based workflow with phase branches**:

\`\`\`
main              ← production, protected, PR-only, tagged releases
  └── develop     ← integration branch, protected
        └── phase/N-description    ← phase work (e.g. phase/3-auth)
        └── feat/description       ← features inside a phase
        └── fix/description        ← bug fixes
        └── chore/description      ← tooling, deps, config
        └── docs/description       ← documentation only
\`\`\`

### Branch Naming Rules

| Prefix         | Purpose                              | Example                          |
| -------------- | ------------------------------------ | -------------------------------- |
| \`phase/\`       | Full PE7 phase milestone             | \`phase/3-authentication\`         |
| \`feat/\`        | New feature within a phase           | \`feat/command-bar-fuzzy-search\`  |
| \`fix/\`         | Bug fix                              | \`fix/stripe-webhook-idempotency\` |
| \`chore/\`       | Tooling, dependencies, config        | \`chore/upgrade-svelte-5.56\`      |
| \`docs/\`        | Documentation only                   | \`docs/add-api-reference\`         |
| \`refactor/\`    | Code restructure, no behavior change | \`refactor/extract-auth-module\`   |
| \`perf/\`        | Performance improvement              | \`perf/graph-view-webgpu-batching\` |
| \`test/\`        | Tests only                           | \`test/add-rbac-integration-suite\` |
| \`release/\`     | Release preparation                  | \`release/v0.5.0\`                 |

### Branch Lifecycle

1. **Create from \`develop\`:**
   \`\`\`bash
   git checkout develop && git pull
   git checkout -b feat/your-feature
   \`\`\`

2. **Work in small, atomic commits** (see [Commit Conventions](#commit-conventions)).

3. **Rebase onto \`develop\` before opening a PR:**
   \`\`\`bash
   git fetch origin
   git rebase origin/develop
   \`\`\`

4. **Open a PR against \`develop\`.** Phase completion PRs merge \`develop\` → \`main\`.

5. **Delete the branch after merge** (GitHub does this automatically if configured).

---

## Commit Conventions

Lumen follows [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/). Every commit message **must** follow this format:

\`\`\`
<type>(<scope>): <subject>

<body>

<footer>
\`\`\`

### Types

| Type       | Use For                                          |
| ---------- | ------------------------------------------------ |
| \`feat\`     | New feature                                      |
| \`fix\`      | Bug fix                                          |
| \`docs\`     | Documentation only                               |
| \`chore\`    | Tooling, dependencies, configuration             |
| \`refactor\` | Code change that neither fixes a bug nor adds a feature |
| \`perf\`     | Performance improvement                          |
| \`test\`     | Adding or correcting tests                       |
| \`style\`    | Code style only (formatting, whitespace)         |
| \`build\`    | Build system or external dependency changes      |
| \`ci\`       | CI/CD configuration changes                      |
| \`revert\`   | Revert a previous commit                         |

### Scopes

Scopes map to PE7 phase domains:

\`auth\`, \`db\`, \`schema\`, \`seed\`, \`rbac\`, \`validation\`, \`crud\`, \`email\`, \`billing\`, \`stripe\`, \`checkout\`, \`portal\`, \`entitlements\`, \`ui\`, \`editor\`, \`graph\`, \`command-bar\`, \`ai\`, \`desktop\`, \`tauri\`, \`ci\`, \`deploy\`, \`docs\`, \`test\`

### Subject Rules

- Imperative mood: "add", not "added" or "adds".
- Lowercase first letter.
- No trailing period.
- 72 characters maximum.

### Body Rules

- Wrap at 100 characters.
- Explain **what** and **why**, not how (the code shows how).
- Use bullet points for multiple changes.

### Footer

Include phase reference and issue links:

\`\`\`
Phase: N
Refs: PE7-<AREA>
Closes: #123
Co-authored-by: Name <email@example.com>
\`\`\`

### Breaking Changes

Prefix with \`!\` and include a \`BREAKING CHANGE:\` footer:

\`\`\`
feat(auth)!: replace session cookies with JWT tokens

BREAKING CHANGE: Sessions stored in cookies are no longer valid.
All users will need to re-authenticate after this change deploys.
\`\`\`

### Full Example

\`\`\`
feat(auth): add passkey support to sign-in flow

- Integrate Better Auth passkey plugin
- Add PasskeyButton component with WebAuthn detection
- Update /auth/sign-in route to offer passkey as primary option
- Add passkey registration flow to /account/security
- Store credential metadata in auth_passkeys table

Phase: 3
Refs: PE7-AUTH
Closes: #47
\`\`\`

---

## Pull Request Process

### Before Opening a PR

- [ ] Branch rebased onto latest \`develop\`.
- [ ] All commits follow Conventional Commits.
- [ ] \`pnpm lint\` passes.
- [ ] \`pnpm check\` passes (TypeScript strict).
- [ ] \`pnpm test\` passes.
- [ ] \`pnpm build\` succeeds.
- [ ] New features have tests.
- [ ] Documentation updated (README, ADR, runbook, inline comments).
- [ ] No secrets, keys, or credentials in the diff.
- [ ] \`CHANGELOG.md\` updated under \`[Unreleased]\`.

### PR Title

Must follow Conventional Commits format (same rules as commit subjects).

### PR Description

Use the template at [\`.github/PULL_REQUEST_TEMPLATE.md\`](./.github/PULL_REQUEST_TEMPLATE.md). At minimum:

- **What** — summary of changes.
- **Why** — motivation and context.
- **How** — approach taken, alternatives considered.
- **Testing** — how the change was tested.
- **Screenshots** — for UI changes.
- **Breaking changes** — call out explicitly.
- **Checklist** — complete before requesting review.

### Review Process

1. Automated CI must pass (lint, type check, test, build).
2. At least one approving review from a maintainer.
3. All review comments resolved.
4. Branch up to date with \`develop\`.

### Merge Strategy

- **Squash and merge** for \`feat/\`, \`fix/\`, \`chore/\`, \`docs/\` branches into \`develop\`.
- **Merge commit** for \`phase/\` branches into \`main\` (preserves phase history).
- **Rebase and merge** only for emergency hotfixes.

---

## Coding Standards

### Language & Framework

- **TypeScript strict mode** across the entire codebase. No \`any\`, no \`@ts-ignore\`, no \`@ts-expect-error\` without justification in comments.
- **Svelte 5 runes only** (\`$state\`, \`$derived\`, \`$effect\`, \`$props\`, \`$bindable\`). No legacy reactive syntax.
- **Snippets + \`{@render}\`** instead of slots.
- **Native event handlers** (\`onclick\`, \`onsubmit\`) — never \`on:click\`.
- **\`$app/state\`** instead of \`$app/stores\` (deprecated).
- **SvelteKit 2.x patterns:** remote functions, form actions, load functions, hooks.

### CSS — PE7 Architecture

- **OKLCH color tokens** only. No hex, no RGB, no HSL.
- **CSS \`@layer\`** for cascade control: \`reset\`, \`tokens\`, \`base\`, \`layout\`, \`components\`, \`utilities\`.
- **Logical properties** (\`padding-inline\`, \`margin-block\`) over physical.
- **Fluid typography** via \`clamp()\`.
- **Native CSS nesting** — no SCSS, no PostCSS plugins.
- **Zero Tailwind.** Zero utility-first frameworks.
- **9-tier breakpoint system** (\`xs\` 320px → \`xl5\` 3840px).

### Icons

- **Iconify only** via \`@iconify/svelte\`.
- **Phosphor** and **Carbon** icon sets only.
- Never Lucide, never Heroicons, never custom SVG inline without justification.

### File Organization

\`\`\`
src/
├── lib/
│   ├── server/          # Server-only modules (db, auth, billing, email)
│   ├── components/      # Svelte components (co-locate .svelte + .svelte.ts)
│   ├── stores/          # Runes-based state modules (.svelte.ts)
│   ├── styles/          # PE7 CSS tokens, layers, utilities
│   ├── utils/           # Pure utility functions
│   └── types/           # Shared TypeScript types
├── routes/              # SvelteKit routes (file-based)
├── hooks.server.ts      # Server hooks (auth, error handling, observability)
├── hooks.client.ts      # Client hooks
└── app.d.ts             # Type augmentations
\`\`\`

### Naming

| Entity           | Convention                          | Example                           |
| ---------------- | ----------------------------------- | --------------------------------- |
| Svelte component | \`PascalCase.svelte\`                 | \`CommandBar.svelte\`               |
| State module     | \`kebab-case.svelte.ts\`              | \`command-bar.svelte.ts\`           |
| Utility module   | \`kebab-case.ts\`                     | \`format-date.ts\`                  |
| Route folder     | \`kebab-case\`                        | \`/settings/account\`               |
| Database table   | \`snake_case\` plural                 | \`node_versions\`                   |
| Database column  | \`snake_case\`                        | \`created_at\`                      |
| TypeScript type  | \`PascalCase\`                        | \`type NodeType\`                   |
| Constant         | \`SCREAMING_SNAKE_CASE\`              | \`const MAX_NODES_FREE_TIER = 100\` |
| Function         | \`camelCase\`                         | \`function getNodeById()\`          |

### Prohibited Patterns

- \`let\` variables for reactive state (use \`$state\`).
- \`$:\` reactive statements (use \`$derived\` or \`$effect\`).
- Slots (\`<slot>\`) — use snippets.
- \`on:click\` event directives — use \`onclick\`.
- \`$app/stores\` imports — use \`$app/state\`.
- \`any\` type — use \`unknown\` and narrow.
- \`console.log\` in committed code — use the logger.
- Hardcoded strings for currency, dates, or translated content.
- Inline styles (except dynamic values via CSS variables).
- Magic numbers — extract to named constants.

---

## Testing Requirements

Every PR must include appropriate tests:

| Change Type            | Required Tests                              |
| ---------------------- | ------------------------------------------- |
| New feature            | Unit + integration + E2E happy path         |
| Bug fix                | Regression test proving the fix             |
| Refactor               | Existing tests pass, no new ones needed     |
| New API endpoint       | Integration test + input validation test    |
| New UI component       | Component test + keyboard interaction test  |
| New database migration | Migration reversibility test                |

### Running Tests

\`\`\`bash
pnpm test              # Run all Vitest tests
pnpm test:watch        # Watch mode
pnpm test:e2e          # Run Playwright end-to-end tests
pnpm test:coverage     # Generate coverage report
\`\`\`

### Coverage Expectations

- **Library code** (\`src/lib/**\`): 90%+ line coverage.
- **Routes** (\`src/routes/**\`): E2E coverage of happy path + critical error paths.
- **Server actions / API endpoints:** 100% coverage of input validation and authorization checks.

---

## Documentation Requirements

Every significant change must update documentation:

| Change                           | Required Doc Update                       |
| -------------------------------- | ----------------------------------------- |
| New feature                      | \`README.md\` feature list, user-facing docs |
| Architectural decision           | New ADR in \`docs/adr/\`                    |
| New environment variable         | \`.env.example\` with inline docs           |
| New runbook-worthy operation     | New runbook in \`docs/runbooks/\`           |
| Breaking change                  | \`CHANGELOG.md\` + migration guide          |
| New API endpoint                 | \`docs/api/\` reference                     |
| Every PR                         | \`CHANGELOG.md\` \`[Unreleased]\` section     |

### Architecture Decision Records (ADRs)

Any decision that affects the shape of the system requires an ADR. Use the template at [\`docs/adr/000-template.md\`](./docs/adr/000-template.md).

ADRs are numbered sequentially and immutable once merged (superseded, not edited).

---

## Security

- Never commit secrets. Use \`.env\` (gitignored) and \`.env.example\` (tracked).
- All secrets must be documented in \`.env.example\` with generation instructions.
- Report vulnerabilities privately per [SECURITY.md](./SECURITY.md).
- All dependencies reviewed before adding. Prefer standard library over new dependencies.
- Run \`pnpm audit\` before every release.

---

## Release Process

Releases are cut at phase milestones.

1. Ensure \`develop\` is green (all CI passing).
2. Update \`CHANGELOG.md\`: move \`[Unreleased]\` entries under the new version.
3. Bump version in \`package.json\`.
4. Open a \`release/vX.Y.Z\` PR from \`develop\` → \`main\`.
5. After merge, tag the release:
   \`\`\`bash
   git checkout main && git pull
   git tag -a vX.Y.Z -m "vX.Y.Z — Phase N: <Description>"
   git push origin vX.Y.Z
   \`\`\`
6. Create a GitHub Release from the tag with the changelog entry as notes.
7. Deploy to production (see [\`docs/runbooks/deploy-production.md\`](./docs/runbooks/deploy-production.md)).

---

## Questions?

- Open a [Discussion](https://github.com/billyribeiro-ux/lumen/discussions) for general questions.
- Open an [Issue](https://github.com/billyribeiro-ux/lumen/issues) for bugs or feature requests.
- Email [hello@lumen.so](mailto:hello@lumen.so) for anything else.

---

Thank you for contributing to Lumen.
