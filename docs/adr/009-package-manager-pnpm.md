# ADR-009: Package manager — pnpm exclusive over npm, yarn, and bun

**Status:** Accepted
**Date:** 2026-04-24
**Deciders:** @billyribeiro-ux
**Phase:** 0 — Foundation
**Tags:** `tooling`, `dependencies`, `ci`, `foundation`

---

## Context

Every JavaScript project picks a package manager once and lives with it forever, in practice. The choice affects:

- **Install determinism.** Will the lockfile produce the same `node_modules` shape on every machine, today and a year from now?
- **CI time.** How long does cold install take? Warm install? Cache restore?
- **Disk usage.** A repo with 50+ dependencies installed across many branches and worktrees can balloon to many GB.
- **Peer-dependency hygiene.** Does the package manager surface peer-dependency conflicts that other managers paper over?
- **Monorepo readiness.** Can the project later split into a workspace (apps + packages) without changing tools?
- **Tooling alignment.** Many tools (Turborepo, Nx, changesets, lefthook, Drizzle Kit) document pnpm-first paths.

`LUMEN_VISION.md` and `CONTRIBUTING.md` already establish that pnpm is the only allowed package manager. This ADR records the decision so future contributors understand the rationale rather than treating it as a project quirk.

Four candidates were evaluated: pnpm, npm, yarn (Berry, 4.x), and bun.

---

## Decision

**Lumen uses pnpm 10.x as its sole package manager. npm, yarn, and bun are banned for installs.**

Concretely:

- The repo contains `pnpm-lock.yaml` only. No `package-lock.json`. No `yarn.lock`. No `bun.lockb`.
- `package.json` declares `"packageManager": "pnpm@10.x.x"` so Corepack enforces it.
- `.npmrc` sets `engine-strict=true`, `auto-install-peers=true`, and `strict-peer-dependencies=true`.
- The pre-commit hook (lefthook, ADR-010 territory) blocks commits that introduce `package-lock.json`, `yarn.lock`, or `bun.lockb`.
- CI installs via `pnpm install --frozen-lockfile`. Mismatch between `pnpm-lock.yaml` and `package.json` is a build failure, not a soft warning.

---

## Consequences

### Positive

- **Disk efficient.** Dependencies are stored once in a content-addressable global store and hard-linked into `node_modules`. A second clone of Lumen on the same machine costs near-zero additional disk.
- **Strict by default.** pnpm builds the `node_modules` tree with only directly-declared dependencies hoisted, exposing accidental implicit imports that npm and yarn (classic) silently allow.
- **Deterministic installs.** `pnpm-lock.yaml` is reproducible across operating systems. CI and dev produce identical trees.
- **Fast.** pnpm is meaningfully faster than npm for both cold and warm installs in our benchmarks; comparable to yarn Berry; slower than bun on the absolute clock but ahead of bun on correctness.
- **Monorepo-ready.** `pnpm-workspace.yaml` is the cleanest workspace primitive in the JavaScript ecosystem. If Lumen ever splits into multi-package layout (apps/web, apps/desktop, packages/ui, packages/sdk), pnpm makes that a config change, not a tooling migration.
- **First-class peer dependency resolution.** pnpm's `auto-install-peers` plus `strict-peer-dependencies` settings catch real bugs that npm hides.
- **Used by SvelteKit itself.** The project we depend on most (ADR-001) develops on pnpm; their patches and reproductions assume pnpm. We stay aligned with upstream.

### Negative

- **Not preinstalled on most CI runners.** GitHub Actions, Vercel, and most CI providers ship Node + npm. We add a Corepack enable step or a setup-pnpm step. Trivial.
- **Some legacy packages assume hoisted node_modules.** A handful of older tools break under pnpm's strict tree. Mitigation is `.pnpmfile.cjs` overrides or `public-hoist-pattern` in `.npmrc` for the specific packages. Few enough cases that the tradeoff is worth it.
- **Engineers familiar with npm or yarn must learn one new command surface.** `pnpm add`, `pnpm install`, `pnpm run`, `pnpm dlx`. Half a page of cheat sheet, lifetime of payoff.

### Neutral

- pnpm's governance is solid but smaller than npm's. Not a meaningful concern; pnpm is mature, widely adopted, and well-funded enough through the OpenJS Foundation and Vercel sponsorship.
- Migrating off pnpm later (to bun, or to whatever comes next) is mechanical: regenerate the lockfile and update `packageManager` in `package.json`. The decision is reversible.

---

## Alternatives Considered

### Alternative 1: npm

**Pros:**
- Preinstalled with Node.js. Zero setup on any machine.
- Most documentation, training data, and tutorials use npm.
- Most tools default to npm in their docs.

**Cons:**
- Hoisted node_modules layout allows phantom imports that work in dev and break in prod (or vice versa).
- Slower than pnpm on cold installs in our measurements.
- No equivalent of pnpm's content-addressable store; multiple clones of the same project on disk waste gigabytes.
- Workspace support is less ergonomic than pnpm's; the `npm workspaces` syntax is functional but feels like an afterthought.

**Why rejected:** npm is "fine," and "fine" is not the standard we hold for tools that touch every install on every machine for the next decade.

### Alternative 2: Yarn (Berry, 4.x)

**Pros:**
- Plug'n'Play (PnP) mode eliminates `node_modules` entirely.
- Strong workspace support.
- Active development.

**Cons:**
- PnP is genuinely innovative but breaks tools that walk `node_modules` directly. Some popular packages still require `nodeLinker: node-modules` mode, which is essentially "yarn pretending to be npm."
- The Yarn 1 → Yarn Berry migration story split the community; documentation is fragmented across versions.
- Lockfile format changed across versions, creating churn.
- pnpm achieves most of Yarn's wins (workspace ergonomics, install speed, strict resolution) without PnP's compatibility cost.

**Why rejected:** pnpm gives us 90% of Yarn Berry's benefits with substantially better tooling compatibility.

### Alternative 3: bun

**Pros:**
- Fastest installer on raw clock time.
- Native TypeScript support, native test runner, native bundler — bun is a runtime, not just an installer.
- Promising future as a complete Node alternative.

**Cons:**
- Maturity. bun's package install resolution has had edge-case bugs at the rate-of-discovery you'd expect from a 2.x-era tool. Production use for a 10-year project is premature.
- Lockfile is binary (`bun.lockb`), making it harder to code-review and harder to debug.
- Not the runtime Lumen ships. The SvelteKit production runtime is Node 22 LTS on Vercel. Using bun for installs but not runtime introduces bun-vs-node behavioral drift in dependencies.
- Ecosystem alignment is thinner — many SvelteKit and Drizzle docs assume pnpm.

**Why rejected:** bun is exciting and improving fast. It is not the right choice for the package manager *of record* for a 10-year project today. Re-evaluate by Phase 14.

### Alternative 4: Mix (allow npm or pnpm interchangeably)

**Pros:**
- Maximum contributor flexibility.

**Cons:**
- Two lockfiles in the repo means two truths. Drift is inevitable.
- CI must pick one; whichever it doesn't pick becomes second-class.
- The "easy onboarding" framing is illusory — a contributor with a working npm install but a broken dev environment is more confused, not less.

**Why rejected:** Strictness compounds. Looseness compounds. We choose strictness.

---

## Implementation Notes

- `package.json` declares `"packageManager": "pnpm@10.x.x"` and `"engines": { "node": ">=22 <23", "pnpm": ">=10 <11" }`.
- `.npmrc` includes `engine-strict=true`, `auto-install-peers=true`, `strict-peer-dependencies=true`.
- A lefthook pre-commit hook rejects commits introducing `package-lock.json`, `yarn.lock`, or `bun.lockb`. The hook also rejects modifications to `pnpm-lock.yaml` that aren't paired with a `package.json` change (i.e. lockfile drift outside intended dependency updates).
- CI uses `pnpm/action-setup@v4` (or equivalent) to enable Corepack and resolve the pinned pnpm version from `package.json`. Vercel deployments use the same pinned version through Corepack.
- `pnpm dlx` is the canonical way to run one-shot tools (`pnpm dlx sv@latest`, `pnpm dlx drizzle-kit push`). `pnpm dlx` is preferred over `pnpm exec` for tools that aren't in our dependency graph.
- The `CONTRIBUTING.md` getting-started section lists `corepack enable && pnpm install` as the canonical bootstrap.

---

## References

- [pnpm documentation](https://pnpm.io)
- [pnpm vs npm vs yarn benchmarks](https://pnpm.io/benchmarks)
- [Corepack documentation](https://nodejs.org/api/corepack.html)
- [SvelteKit's pnpm-first development](https://github.com/sveltejs/kit)
- Related: [ADR-010: Lint + format — Biome](./010-lint-format-biome.md)
- Related: `LUMEN_VISION.md` § Forbidden Patterns
- Related: `CONTRIBUTING.md` § Local Setup

---

## Review & Revision History

| Date | Author | Change |
|---|---|---|
| 2026-04-24 | @billyribeiro-ux | Initial draft — accepted |
