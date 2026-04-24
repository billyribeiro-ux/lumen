# ADR-010: Lint + format — Biome over ESLint + Prettier

**Status:** Accepted
**Date:** 2026-04-24
**Deciders:** @billyribeiro-ux
**Phase:** 0 — Foundation
**Tags:** `tooling`, `lint`, `format`, `ci`, `foundation`

---

## Context

Lumen needs both linting (catch bugs and style violations) and formatting (canonical layout). Historically the JavaScript answer is ESLint + Prettier, run separately, configured separately, glued together with `eslint-config-prettier` and `eslint-plugin-prettier` to keep them from fighting each other. The combo works but carries baggage:

- Two configs (`.eslintrc.*` and `.prettierrc.*`) to keep aligned.
- Two binaries to invoke in CI and pre-commit hooks.
- Two upgrade paths to track.
- Plugin ecosystem fragmentation, especially for TypeScript and Svelte.
- Materially slower than the alternatives on large codebases.

In 2024–2025 a real alternative emerged: **Biome 2.x**, a Rust-based tool that does both linting and formatting in one binary, with native TypeScript understanding (no `@typescript-eslint` plugin pile), one config file, and 10–25× the speed of ESLint + Prettier on the same workload.

Three options were evaluated: Biome 2, ESLint 9 + Prettier 3, and the do-nothing alternative (no linting / formatting tooling).

---

## Decision

**We will use Biome 2.x as Lumen's sole lint + format tool.**

Concretely:

- A single `biome.json` at the repo root configures both linting and formatting.
- `pnpm biome check` is the canonical `lint + format check` command. `pnpm biome check --write` applies fixes.
- Pre-commit hook (lefthook) runs `biome check --staged --no-errors-on-unmatched` on changed files only.
- CI runs `biome ci` which is optimized for non-zero exit codes and machine-readable output.
- `.editorconfig` defines whitespace/line-ending defaults; Biome reads it for consistency.
- `svelte-check` continues to handle Svelte-specific type checking (Biome does not yet lint `.svelte` files at parity with TypeScript-only files; we opt to use `prettier-plugin-svelte` as a *file-formatter for `.svelte` files only*, gated to `*.svelte` via the formatter's `overrides`).

Style choices encoded in `biome.json`:

- 2-space indent.
- 100-character line width.
- Single quotes for JS/TS string literals.
- Double quotes for JSX/HTML attributes.
- Always semicolons.
- Trailing commas: `all`.
- Linter rules: Biome's `recommended` set plus selected `nursery` rules with stable upstream behavior.

---

## Consequences

### Positive

- **One tool.** One install, one config, one binary, one cache, one upgrade. The mental tax of "is this an ESLint rule or a Prettier rule?" disappears.
- **10–25× faster** than ESLint + Prettier on warm runs and even larger margins on cold runs. Pre-commit feedback is sub-second on a typical change set; CI lint stage is bounded by overhead, not work.
- **Native TypeScript.** No `@typescript-eslint/parser`, no `eslint-config-airbnb-typescript`, no plugin compatibility matrix. Biome's parser is purpose-built for modern TypeScript including JSX and TSX.
- **Deterministic formatting.** Biome's formatter produces stable output across versions; Prettier has a more aggressive policy of formatting changes between minors.
- **Active development.** The Biome team (formed from former Rome maintainers) ships frequent releases with clear changelogs and a stable governance model.
- **Single source of truth for style.** `biome.json` is the only file the team needs to know about for code style, rather than `.prettierrc` + `.eslintrc.cjs` + `.editorconfig` + `tsconfig.json` `compilerOptions` style flags.

### Negative

- **Smaller rule set than ESLint.** ESLint has thousands of rules across plugins; Biome covers the rules that matter most (correctness, security, suspicious patterns, performance hints) but not every niche stylistic preference. Acceptable; we don't need every rule, we need the right ones.
- **Svelte support is partial.** Biome formats and lints TypeScript / JavaScript / JSON / CSS competently but does not yet have a first-class `.svelte` parser at parity. We pair Biome with `prettier-plugin-svelte` *for `.svelte` files only* — a single, narrow exception. We accept this until Biome ships a Svelte parser (already on their public roadmap).
- **Less AI training data than ESLint.** AI assistants will sometimes propose ESLint rule names. We translate to Biome equivalents.
- **Migrating off Biome later** would require regenerating ESLint + Prettier configs from scratch. A real cost; bounded by the fact that lint configs are usually re-derived per project anyway.

### Neutral

- Biome's lint output and format diff use the same machine-readable format, simplifying CI integrations and editor plugins.
- Biome's "domains" feature (project-aware rules) lets us scope rules per directory (e.g. stricter rules in `src/lib/server/`) without invoking multiple configs.

---

## Alternatives Considered

### Alternative 1: ESLint 9 + Prettier 3

**Pros:**
- Industry default for ten years. Documentation, training data, and editor integrations are uniformly mature.
- ESLint 9's flat config is genuinely better than the legacy `.eslintrc` ecosystem.
- Prettier 3 added trailing-commas-by-default and other long-requested defaults.
- Largest plugin ecosystem; rules exist for nearly every framework.

**Cons:**
- Two tools, two configs, two upgrade cycles, glue libraries to keep them from fighting.
- Materially slower on every operation.
- ESLint flat config is better than legacy but still verbose.
- The TypeScript story (`typescript-eslint`) is a parallel project that must be kept in step — three moving parts now.
- The "ESLint formatter rules vs Prettier rules" debate is a perennial source of bikeshedding.

**Why rejected:** All the strengths are diminishing returns on capabilities Lumen doesn't need. All the weaknesses compound forever. Biome eats this category.

### Alternative 2: Just Prettier (skip lint)

**Pros:**
- Zero-config formatter.
- Universally understood.

**Cons:**
- No bug-finding rules. Lumen is too important to skip linting on the strict-TypeScript-no-`any` policy.
- TypeScript catches type errors but not stylistic / suspicious patterns (unused imports, accidental console.log, dead branches).

**Why rejected:** Linting is non-optional at PE7 standards.

### Alternative 3: Just ESLint (skip format)

**Pros:**
- Some lint rules can format adjacent issues.
- Gives total control.

**Cons:**
- ESLint as a formatter is slow, fiddly, and not its job. Prettier-style canonical layout is what actually keeps PR diffs readable.
- Auto-formatting is one of the highest-leverage developer experiences. Skipping it is leaving value on the floor.

**Why rejected:** Formatting is non-optional too.

### Alternative 4: deno lint + deno fmt

**Pros:**
- Single tool, very fast, very Rust.
- Deno's built-in tooling is excellent.

**Cons:**
- We are not running Deno. Adopting Deno's tools introduces a runtime mismatch where the linter understands Deno's stdlib quirks but our code is written for Node.
- Smaller community than Biome on the linting side.

**Why rejected:** Right tool for the wrong runtime.

### Alternative 5: Do nothing

**Pros:**
- Zero config.

**Cons:**
- PE7 standards include "zero warnings" and "no `any`." Tools enforce this; humans don't, reliably, at scale.
- Inconsistent formatting in PRs becomes a perpetual review tax.

**Why rejected:** We are not building a script.

---

## Implementation Notes

- `biome.json` is committed at the repo root. The minimum useful structure:
  ```json
  {
    "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
    "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
    "files": { "ignoreUnknown": true },
    "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
    "javascript": { "formatter": { "quoteStyle": "single", "semicolons": "always", "trailingCommas": "all" } },
    "linter": { "enabled": true, "rules": { "recommended": true } }
  }
  ```
- The `lefthook.yml` `pre-commit` job runs `biome check --staged --no-errors-on-unmatched --write` (formatter applies, linter blocks on unfixable issues).
- `*.svelte` files are formatted via Prettier with `prettier-plugin-svelte`. A `.prettierrc` minimal config exists *only* for that plugin's needs; Biome owns everything else. The config sets `overrides: [{ files: '*.svelte', options: { parser: 'svelte' } }]` and explicitly does not format `.ts` / `.js` / `.json` / `.css` (Biome's territory).
- The CI lint stage runs `biome ci .` plus `prettier --check '**/*.svelte'` plus `pnpm svelte-check` (typing).
- `biome.json` `overrides` block scopes stricter rules to `src/lib/server/` (no console.log, no implicit any-equivalents) and looser rules to `tests/` (allow `any` in fixtures).
- Editor integration: VS Code uses the official `biomejs.biome` extension as the default formatter. `.vscode/settings.json` (committed) sets `editor.defaultFormatter: 'biomejs.biome'` and `editor.formatOnSave: true`.

---

## References

- [Biome documentation](https://biomejs.dev)
- [Biome 2.0 release notes](https://biomejs.dev/blog/biome-v2/)
- [Biome lint rule catalog](https://biomejs.dev/linter/rules/)
- [Biome vs ESLint + Prettier benchmarks](https://biomejs.dev/blog/biome-wins-prettier-challenge/)
- Related: [ADR-009: Package manager — pnpm](./009-package-manager-pnpm.md)
- Related: `CONTRIBUTING.md` § Coding Standards

---

## Review & Revision History

| Date | Author | Change |
|---|---|---|
| 2026-04-24 | @billyribeiro-ux | Initial draft — accepted |
