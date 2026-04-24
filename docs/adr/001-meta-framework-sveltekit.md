# ADR-001: Meta-framework — SvelteKit 2 over Next, Nuxt, and Remix

**Status:** Accepted
**Date:** 2026-04-24
**Deciders:** @billyribeiro-ux
**Phase:** 0 — Foundation
**Tags:** `framework`, `frontend`, `fullstack`, `foundation`

---

## Context

Lumen is a full-stack web application with a server-authoritative data model, keyboard-first UI, and a shared codebase that must also ship as a Tauri 2 desktop app. It needs a meta-framework that provides:

- Server-rendered pages with progressive enhancement.
- First-class form handling (critical for a keyboard-driven, JS-optional UX).
- A typed server↔client boundary.
- Edge-compatible runtime for low-latency reads.
- A UI compiler capable of minimal runtime overhead (the graph view and command bar must stay fast on modest hardware).
- Active maintenance with a clear governance model for 10-year longevity.

Four realistic candidates were evaluated: SvelteKit 2, Next.js 16, Nuxt 3, and Remix (React Router v7).

---

## Decision

**We will use SvelteKit 2.57.x on top of Svelte 5.55.x (runes-only) as Lumen's meta-framework.**

Core reasons:

1. **Server-authoritative by design.** Form actions, remote functions, and load functions encode the server boundary explicitly. There is no ambient "server components vs client components" mental tax.
2. **Progressive enhancement is the default.** Form actions work without JavaScript and are enhanced with `use:enhance`. This aligns directly with Lumen's "keyboard-first, JS-optional" principle.
3. **Smaller runtime.** Svelte compiles away framework overhead; the runtime Lumen ships is materially smaller than any React-based alternative. This matters for the graph view and for desktop app memory footprint.
4. **Runes model maps cleanly to Lumen's state domains.** `$state`, `$derived`, and `.svelte.ts` modules let us express local state without external stores or hook-like ceremony.
5. **The same build powers Tauri.** The Tauri 2 desktop app wraps the exact same SvelteKit build — no dual codebase, no parallel maintenance.

SvelteKit is developed by Svelte core maintainers at Vercel and has a clear 2.x → 3.x upgrade path already sketched in release notes. The team ships monthly.

---

## Consequences

### Positive

- Single codebase powers web and desktop.
- Smaller client bundle → better performance budget compliance.
- Fewer abstractions between template and DOM → easier reasoning, easier debugging.
- Native form handling without libraries means fewer moving parts for the auth, onboarding, and checkout flows.
- Strong TypeScript integration — generated `$types` files eliminate most manual typing of route params and loaded data.

### Negative

- Smaller ecosystem than React. Some niche libraries (e.g. some observability SDKs, some chart libraries) need Svelte wrappers or direct DOM integration.
- Fewer engineers on the market with deep Svelte 5 runes experience. Hiring is slightly harder at the margins.
- Svelte 5 is relatively new (released August 2024); runes semantics are still stabilizing in subtle ways across releases. Requires discipline to track monthly releases.

### Neutral

- Team structure is single-engineer (for now); ecosystem size matters less than it would for a 50-person team.
- Component portability to other frameworks (React, Vue) is low. This is an acceptable trade for the benefits above.

---

## Alternatives Considered

### Alternative 1: Next.js 16 (App Router)

**Pros:**
- Largest ecosystem; every library supports it first.
- React Server Components are genuinely powerful for certain patterns.
- Deepest Vercel integration.

**Cons:**
- RSC + Client Component split adds cognitive overhead for a solo engineer.
- React runtime is significantly larger than Svelte's compiled output.
- The Next ecosystem churns aggressively; upgrade pain is real.
- Form handling still requires third-party libraries for anything non-trivial (react-hook-form + zod + server actions).

**Why rejected:** The complexity-per-feature ratio is worse for our needs. We do not benefit enough from RSC to justify the model, and we pay a size cost that hurts the graph view and desktop app.

### Alternative 2: Nuxt 3

**Pros:**
- Vue 3 Composition API is a reasonable DX.
- Strong conventions and file-based routing.
- Good edge story via Nitro.

**Cons:**
- Vue runtime is comparable to React in size — not as lean as Svelte.
- Weaker type inference in templates compared to SvelteKit.
- No equivalent of SvelteKit's remote functions or form actions out of the box.

**Why rejected:** No decisive advantage over SvelteKit on any axis that matters, and a smaller win on bundle size.

### Alternative 3: Remix (React Router v7)

**Pros:**
- Form-first philosophy aligns with Lumen's values.
- Loader/action pattern is excellent.
- Runs well on the edge.

**Cons:**
- Still carries React runtime cost.
- Team disruption after Shopify acquisition and merge with React Router has created uncertainty about long-term direction.
- Ecosystem split between Remix v2 and React Router v7 creates documentation confusion.

**Why rejected:** 10-year longevity test fails — the governance turbulence in 2024–2025 is recent enough to make this a risk. SvelteKit's governance is stable and well-funded.

### Alternative 4: Do nothing (roll a custom stack)

**Pros:**
- Total control.

**Cons:**
- Solo engineer + greenfield product + custom framework = not shipping.
- Every meta-framework concern (routing, SSR, form handling, edge runtime, hot reload) becomes in-scope work.

**Why rejected:** Lumen is the product; a meta-framework is not.

---

## Implementation Notes

- Use `sv create` for initial scaffold.
- Use `@sveltejs/adapter-vercel` 5.x for Vercel deployment.
- All new code uses runes-only (`$state`, `$derived`, `$effect`, `$props`, `$bindable`). No `$:` reactive statements.
- All new components use snippets + `{@render}` (no slots).
- All event handlers use native syntax (`onclick`, `onsubmit`) — never `on:click`.
- `$app/state` is used exclusively; `$app/stores` is deprecated and banned.
- Remote functions are preferred over `+page.server.ts` + `+page.ts` boilerplate for dynamic data flows where progressive enhancement is not required.

---

## References

- [SvelteKit official docs](https://svelte.dev/docs/kit)
- [Svelte 5 runes reference](https://svelte.dev/docs/svelte/what-are-runes)
- [Announcing SvelteKit 2](https://svelte.dev/blog/sveltekit-2)
- [Announcing Svelte 5](https://svelte.dev/blog/svelte-5-is-alive)
- Related: [ADR-007: UI Primitives — Bits UI over shadcn-svelte](./007-ui-primitives-bits-ui.md)
- Related: [ADR-008: Desktop — Tauri 2 over Electron](./008-desktop-tauri-2.md)

---

## Review & Revision History

| Date | Author | Change |
|---|---|---|
| 2026-04-24 | @billyribeiro-ux | Initial draft — accepted |
