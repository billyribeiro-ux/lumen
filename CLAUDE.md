# Lumen — Claude Code Operating Guide

> **Read this before changing code.** It encodes the standards this project is held to and the tooling Claude has available.
>
> Source-of-truth docs:
> - `docs/LUMEN_VISION.md` — product spec, themes, keyboard map, tier pricing, forbidden UI patterns.
> - `ARCHITECTURE.md` — system design, data model, request lifecycle, security model, performance budget.
> - `docs/adr/` — accepted architectural decisions (immutable; supersede via new ADR).
> - `ROADMAP.md` — phase-to-version mapping.
> - `docs/BUILD_LOG.md` — strict per-commit, per-file build trail (you must append after every commit).

---

## Standards (Non-Negotiable)

1. **TypeScript strict mode** — zero `any`, zero `@ts-ignore`, zero warnings. `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax` all on.
2. **Svelte 5 runes only** — `$state`, `$derived`, `$effect`, `$props`, `$bindable`. Snippets + `{@render}` instead of `<slot>`. Native event handlers (`onclick`, `onsubmit`) — never `on:click`. `$app/state`, never `$app/stores`. No `$:` reactive statements.
3. **PE7 CSS Architecture** — OKLCH only for color; logical properties only (`padding-inline`, `margin-block`, `border-block-end`); `clamp()` for fluid scales; native CSS nesting; **zero Tailwind**; 9-tier breakpoint system. Theme switching via `<html data-theme>` (Obsidian default OLED, Parchment, Nord-PE7).
4. **Production-grade only** — no placeholders, no "you can add more here", no shortcuts.
5. **pnpm exclusive** — never npm, yarn, or bun. Lockfile drift is a build failure.
6. **Iconify + Phosphor / Carbon only** — never Lucide, never Heroicons. Icons load on demand via `@iconify/svelte`.
7. **Conventional Commits** — `type(scope): subject` with `Phase: N` and `Refs: PE7-<AREA>` footers. See `commitlint.config.js` for allowed scopes.
8. **Branch + PR workflow** — never push directly to `main`. Cut feature branches like `phase-N/<topic>`; merge via PR.
9. **10-year longevity** — every dependency is a permanent debt. Prefer stdlib.

---

## Forbidden Patterns

Per `docs/LUMEN_VISION.md`:

- **Tailwind CSS** — banned across all surfaces.
- **Emojis in UI** — banned (except user-entered content).
- **Modals without keyboard escape** — banned.
- **Actions without keyboard shortcuts** — banned (command bar discovery is the minimum).
- **Dark patterns** — banned (no deceptive trials, no hidden cancels).
- **Google Fonts CDN** — banned (self-host Inter, JetBrains Mono, Literata).
- **Third-party analytics with PII** — banned.

---

## Build Log Discipline

After **every** `git commit`, append rows to `docs/BUILD_LOG.md` covering each file in the commit, then commit the log update as the next commit. The log commit itself gets a row marked `_this commit_` until the next log update fills in the SHA. See the addendum at the bottom of `docs/handoffs/2026-04-24-phase-0-handoff.md` for the exact rule.

---

## Tooling Available

### Svelte MCP server (`https://mcp.svelte.dev/mcp`)

You have access to comprehensive Svelte 5 and SvelteKit documentation through the official Svelte MCP. **Use it whenever you write or modify Svelte code.**

#### `list-sections`
Use this **first** to discover all available documentation sections. Returns titles, use_cases, and paths. When asked about a Svelte or SvelteKit topic, always start with `list-sections`.

#### `get-documentation`
Retrieves full documentation content for specific sections. Accepts single or multiple sections. After `list-sections`, analyze the returned `use_cases` field, then call `get-documentation` for **every** section relevant to the task.

#### `svelte-autofixer`
Analyzes Svelte code and returns issues and suggestions. **Use this on every Svelte file you write before showing it to the user.** Keep calling it until no issues or suggestions remain.

#### `playground-link`
Generates a Svelte Playground link with the provided code. Only call this **after user confirmation** and **never** if the code was written to files in their project.

### Local CLI

- `pnpm check` — `svelte-kit sync && svelte-check` (type check)
- `pnpm lint` — Biome lint + format check (TS/JS/JSON/CSS)
- `pnpm lint:fix` — Biome auto-fix
- `pnpm format:check` — Biome format check + Prettier `*.svelte` check
- `pnpm format` — Biome format + Prettier `*.svelte`
- `pnpm test:unit` — Vitest (browser + node modes)
- `pnpm test:e2e` — Playwright
- `pnpm build` — Vite build (Vercel adapter)
- `pnpm db:generate` / `db:migrate` / `db:studio` / `db:push` — Drizzle Kit (lands in step 1.13)

### Git hooks (lefthook)

Activate locally with `pnpm lefthook install`. Pre-commit runs Biome auto-fix, Prettier on `*.svelte`, `svelte-check`, gitleaks (if installed), and a guard that rejects rival lockfiles. commit-msg runs commitlint.

---

## When You Disagree With This Doc

If reality and this doc disagree, **fix the doc in the same PR as the code change**. Living documents (`ARCHITECTURE.md`, `ROADMAP.md`) and frozen documents (`docs/adr/*`) play different roles — see `docs/adr/README.md` for which to update.
