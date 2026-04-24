# ADR-005: Validation — Valibot over Zod, Arktype, TypeBox, and Yup

**Status:** Accepted
**Date:** 2026-04-24
**Deciders:** @billyribeiro-ux
**Phase:** 0 — Foundation
**Tags:** `validation`, `forms`, `bundle-size`, `foundation`

---

## Context

Every boundary in Lumen needs a validator. Form actions, remote functions, webhook payloads, AI-generated content, query parameters, and file imports all cross trust boundaries. The validator library must:

- **Be tiny on the client.** Validation runs in the browser as well as the server (progressive enhancement keeps server validation authoritative, but client-side echo improves UX). Every kilobyte shipped to the browser eats into the 150KB initial-JS budget defined in `ARCHITECTURE.md` §13.
- **Tree-shake aggressively.** A schema that only uses `string` and `email` should not pull in date or array helpers.
- **Have a Superforms adapter.** Lumen uses `sveltekit-superforms` for every form (Phase 5); the validator must integrate as a first-class adapter, not via a wrapper that breaks type inference.
- **Express the same shapes as TypeScript.** Discriminated unions, branded types, conditional refinements, and async refinements (e.g. uniqueness checks against the database) must all be expressible.
- **Be maintained.** The library will be imported in hundreds of files. Sunsetted or single-maintainer libraries are a long-term liability.

Four candidates evaluated: Valibot, Zod 4, Arktype, TypeBox. Yup was disqualified up front (lacks discriminated union support at parity, smaller TypeScript inference story, momentum lost to Zod and Valibot).

---

## Decision

**We will use Valibot 1.x as Lumen's validation library across the entire stack.** All forms use the `@superforms/valibot` adapter. Server-side handlers, webhook receivers, and remote functions validate input via Valibot before any database write. Validation errors are mapped to a centralized error type and rendered consistently across UI surfaces.

Concretely:

- Schemas live next to the code that owns them, not in a global `schemas/` directory. A form's schema sits beside its `+page.server.ts`; an API endpoint's schema sits beside its `+server.ts`; a remote function's schema sits in the same `.remote.ts` file.
- Shared schemas (e.g. `nodeIdSchema`, `slugSchema`, `oklchColorSchema`) live in `src/lib/validation/`.
- Async refinements that touch the database (uniqueness checks) are written as separate validators that compose with the synchronous schema, not as `pipeAsync` chains. This keeps the synchronous schema usable on the client.
- The Superforms client validator is `valibotClient(schema)`; the server validator is `valibot(schema)`. Both are imported from the official adapter package.

---

## Consequences

### Positive

- **~1KB minified+gzipped** for a typical schema vs Zod's ~14KB for an equivalent shape. Across the dozens of schemas the app ships to the browser, this is the difference between fitting the JS budget and not.
- **Tree-shaking actually works.** Valibot's API is built around free functions (`v.string()`, `v.email()`, `v.pipe()`) rather than methods on a chain object. Bundlers eliminate every helper not imported.
- **First-class Superforms adapter.** The `valibot` and `valibotClient` adapters are maintained by Superforms' author; type inference flows from schema to form proxy without manual type assertions.
- **TypeScript inference parity with Zod.** `v.InferOutput<typeof schema>` and `v.InferInput<typeof schema>` provide everything we need. Discriminated unions, intersections, and brands all infer correctly.
- **Async validation is a first-class composable.** Database uniqueness checks, remote permission checks, and AI-generated content validations all use the same async refinement pattern.
- **Fast.** Valibot's parser is materially faster than Zod's for the same shape, which matters for high-throughput webhook validation paths.

### Negative

- **Smaller community than Zod.** Tutorials, AI training data, and Stack Overflow answers reference Zod by default. We translate when we must.
- **API verbosity.** `v.pipe(v.string(), v.email())` reads less ergonomically than Zod's `z.string().email()`. Real cost; bearable cost.
- **Some niche patterns** (e.g. recursive schemas with full inference) are slightly less polished than Zod's. Not a blocker for any v1.0.0 use case.

### Neutral

- Migration to Zod (or any other validator) would be tedious but mechanical — schemas are leaf modules, the API surface is small, and a codemod could automate 90% of it. The decision is reversible; the cost of reversal scales with adoption depth, not with cleverness.

---

## Alternatives Considered

### Alternative 1: Zod 4

**Pros:**
- Largest community in the JavaScript validation space.
- Most polished documentation.
- Zod 4 (released 2025) closed many tree-shaking gaps and improved performance materially over Zod 3.
- Massive AI training data — Claude, Copilot, and Cursor all "speak Zod" fluently.

**Cons:**
- Even Zod 4 is meaningfully larger than Valibot for equivalent schemas.
- Method-chaining API is harder for bundlers to optimize than free functions.
- The 3.x → 4.x migration was rough and segmented the ecosystem; library authors are still catching up.

**Why rejected:** The bundle-size delta is decisive for a client-shipped library. We give up some DX and AI ergonomics; we gain a better product on the user's machine.

### Alternative 2: Arktype

**Pros:**
- Schemas are TypeScript types — closest possible alignment between value shape and type shape.
- Excellent error messages.
- Genuinely innovative API.

**Cons:**
- 1.0 only stabilized recently; the ecosystem (adapters, integrations) lags Valibot and Zod.
- No first-class Superforms adapter at the time of this decision.
- Smaller maintainer team; the longevity question is open.

**Why rejected:** The type-as-schema approach is exciting, but the lack of an actively-maintained Superforms adapter forces a custom integration we don't want to maintain. Worth re-evaluating in a year.

### Alternative 3: TypeBox

**Pros:**
- JSON Schema output is built in — useful if we ever need to interop with OpenAPI tooling.
- Tiny runtime.
- Strong TypeScript inference.

**Cons:**
- API is closer to JSON Schema's ergonomics than to TypeScript's, which makes complex shapes verbose.
- No mainstream Superforms adapter.
- Smaller community than even Valibot.

**Why rejected:** Optimizes for JSON Schema interop we don't need at the cost of DX we do need.

### Alternative 4: Do nothing (write hand-rolled validators)

**Pros:**
- Zero dependency.
- Maximum performance for trivial shapes.

**Cons:**
- Hundreds of schemas would need to be hand-written and maintained.
- No type inference — every validator returns `unknown` and we cast.
- Async refinements and discriminated unions become hand-rolled state machines.

**Why rejected:** Validation is the single highest-leverage library category in the stack. Owning it ourselves is the wrong place to express craft.

---

## Implementation Notes

- The Superforms initialization is `superValidate(request, valibot(schema))` server-side and `superForm(data.form, { validators: valibotClient(schema) })` client-side. This pattern is canonical and is documented in `CONTRIBUTING.md`.
- A central `src/lib/validation/errors.ts` defines the `ValidationError` type and helpers to convert Valibot's `IssueDot` output into UI-friendly field errors.
- The `lumen.validation.input` event is logged on every validation failure with the schema name and the issue paths (never the values, to avoid PII leakage). This becomes a Sentry breadcrumb.
- Schemas that are shared between client and server live in `src/lib/validation/` and are imported by both `+page.server.ts` and `+page.svelte` via `$lib/validation/...`. Schemas that are server-only live next to their handlers and never appear in a `.svelte` import.
- When a schema uses an async refinement (uniqueness check), the synchronous schema is exposed as `xSchema` and the composed async-aware version as `xSchemaWithUniqueness`. The client form uses the synchronous version; the server form uses the composed version.

---

## References

- [Valibot documentation](https://valibot.dev)
- [Bundle size comparison: Valibot vs Zod](https://valibot.dev/guides/bundle-size/)
- [sveltekit-superforms Valibot adapter](https://superforms.rocks/concepts/adapters)
- [Valibot async pipelines](https://valibot.dev/guides/async-validation/)
- Related: [ADR-001: Meta-framework — SvelteKit 2](./001-meta-framework-sveltekit.md)
- Related: [ADR-003: ORM — Drizzle](./003-orm-drizzle.md)

---

## Review & Revision History

| Date | Author | Change |
|---|---|---|
| 2026-04-24 | @billyribeiro-ux | Initial draft — accepted |
