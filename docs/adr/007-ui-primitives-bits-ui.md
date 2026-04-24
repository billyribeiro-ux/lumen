# ADR-007: UI primitives — Bits UI over shadcn-svelte, Skeleton, raw Melt UI, and rolling custom

**Status:** Accepted
**Date:** 2026-04-24
**Deciders:** @billyribeiro-ux
**Phase:** 0 — Foundation
**Tags:** `ui`, `accessibility`, `components`, `foundation`

---

## Context

Lumen is keyboard-first, dense, and highly interactive — a command bar, split panes, dialogs, comboboxes, menus, popovers, date pickers, PIN inputs for 2FA, file dropzones, and a graph view all need the same accessibility scaffolding underneath. Every primitive must:

- **Be headless.** Lumen's visual identity (PE7 CSS, OKLCH tokens, three themes — Obsidian / Parchment / Nord-PE7 per `LUMEN_VISION.md`) is the product. Component libraries that ship opinionated styles fight us.
- **Be Svelte 5 native.** Runes (`$state`, `$derived`, `$effect`), snippets, native event handlers — first class, not retrofitted from a Svelte 4 base.
- **Implement WAI-ARIA correctly.** Focus management, escape semantics, keyboard navigation, ARIA roles and relations — all must work without our reinvention. This is the hardest thing to get right and the easiest thing to get subtly wrong.
- **Cover the surface.** Dialog, AlertDialog, Popover, Combobox, Select, Menu, ContextMenu, DropdownMenu, Tabs, Tooltip, Switch, Checkbox, RadioGroup, ScrollArea, Slider, Toggle, ToggleGroup, DatePicker, RangeCalendar, PinInput, Toast, Avatar, Accordion, Collapsible, Progress, Separator, AspectRatio. Anything missing is something we hand-roll, which is something we maintain.
- **Have no Tailwind dependency.** Many "Svelte UI kits" assume Tailwind. PE7 CSS bans it (`LUMEN_VISION.md` § Forbidden Patterns).
- **Be maintained.** Component libraries are forever. A library that stops keeping up with Svelte 5 / SvelteKit 2 is a forced rewrite.

Four candidates evaluated: Bits UI, shadcn-svelte, Skeleton, and raw Melt UI. Custom-from-scratch was the do-nothing alternative.

---

## Decision

**We will use Bits UI 2.17.x as Lumen's headless component primitive layer.**

Concretely:

- All interactive primitives (Dialog, Popover, Combobox, Menu, etc.) are imported from `bits-ui` and styled in PE7 CSS.
- Lumen wraps Bits UI primitives in thin component shells under `src/lib/components/primitives/`. Wrappers add token-driven styling, default variants, and team-specific defaults (e.g. our `Dialog` always renders a backdrop blur layer).
- Application code never imports from `bits-ui` directly; it imports from `$lib/components/primitives` so the wrapper layer is the only knowledge surface day-to-day.
- A few primitives Bits UI doesn't ship (e.g. our Command Bar, our Split Pane, our File Dropzone) are built on Bits UI's underlying state machines (Bits UI exposes Melt UI builders for advanced cases) or hand-rolled when no primitive applies.

---

## Consequences

### Positive

- **Headless + Svelte 5 native.** Bits UI is rebuilt for Svelte 5 with runes, snippets, and native events as first-class concerns. No "Svelte 4 in Svelte 5 clothing" smell.
- **WAI-ARIA correctness is solved by experts.** Focus traps, ESC key handling, ARIA-labelledby relations, dismissible-via-pointer-down-outside semantics — all implemented correctly and shared.
- **Wide primitive surface.** Bits UI ships ~30 primitives covering nearly everything Lumen needs through Phase 13. Phase 16+ AI surfaces and Phase 17 graph view need custom work; everything else is Bits.
- **Pairs cleanly with PE7 CSS.** Zero Tailwind dependency. Components ship as data-attribute-driven structures (`data-state`, `data-side`, `data-orientation`) that PE7 CSS can target precisely without inline styles or class-name wars.
- **Active development.** Bits UI ships releases monthly, follows Svelte 5 closely, and has clear governance. The maintainer (Hunter Johnston / Huntabyte) also maintains shadcn-svelte and Melt UI — ecosystem coherence is high.
- **Underlying Melt UI builders are exposed** for advanced use cases. When a Bits primitive doesn't quite fit, we drop down to the Melt builder it composes from rather than reinventing.

### Negative

- **One more dependency.** Bits UI itself is small, but adopting it commits us to keeping it on the latest Svelte 5 cadence. Mitigated by the maintainer's release discipline.
- **No theming opinions.** This is a feature for us; it is also work. We must ship our own visual layer for every primitive (button variants, dialog padding, popover offsets) — which is exactly what we want, but it is not free.
- **Primitive APIs are stable but not eternal.** Bits 2.x is the current major version; a 3.x is expected eventually. We accept the upgrade cost as part of the dependency. Not catastrophic — primitives are concentrated in `src/lib/components/primitives/`, so a major upgrade is a focused refactor, not a sprawling one.
- **Less AI training data than React Radix UI.** Generated code from AI assistants will sometimes suggest Radix patterns; we adapt them.

### Neutral

- The boundary "import only from `$lib/components/primitives`, never from `bits-ui` directly" is a project convention, not a tooling-enforced one. A lefthook check could grep for direct imports if drift becomes a problem; not necessary at v0.
- Bits UI's bundle weight is concentrated; tree-shaking by primitive works well in production builds.

---

## Alternatives Considered

### Alternative 1: shadcn-svelte

**Pros:**
- Largest community in the Svelte component space.
- Component code is vendored into the project, giving total control.
- Excellent design language out of the box.

**Cons:**
- **Tailwind-required.** `LUMEN_VISION.md` bans Tailwind. Removing Tailwind from shadcn-svelte components is non-trivial — every variant, every size, every state is expressed in `cn()` calls over Tailwind classes.
- Vendored components mean updates are manual diffs forever. For a personal project that is fine; for Lumen we'd rather track a real release stream.
- shadcn-svelte is *built on Bits UI underneath*. Adopting it is adopting Bits UI plus a Tailwind-shaped opinion we don't want.

**Why rejected:** Tailwind ban is decisive. Bits UI is the layer underneath; we go to the source.

### Alternative 2: Skeleton

**Pros:**
- Full design system, not just primitives.
- Strong Tailwind integration (which is, again, a problem here).
- Active maintainer, clear governance.

**Cons:**
- Tailwind-required. Same disqualifier as shadcn-svelte.
- Opinionated visual layer. Replacing or overriding it is a slog.
- Component coverage is broad but not as deep as Bits UI on advanced primitives (DatePicker, PinInput, ScrollArea).

**Why rejected:** Same Tailwind problem; less primitive depth in exchange for visual opinions we'd remove anyway.

### Alternative 3: Raw Melt UI

**Pros:**
- Builder API gives total control over composition.
- Bits UI itself is a thin wrapper around Melt. Skipping the wrapper means one less abstraction.

**Cons:**
- Builder ergonomics are powerful but verbose. Every primitive use site grows by 5–15 lines vs the equivalent Bits component.
- Documentation is more sparse than Bits' (Bits is the polished public surface; Melt is the engine).
- We'd reimplement Bits' wrapper layer for every primitive, ourselves, on every project.

**Why rejected:** Bits is Melt with the right abstractions already chosen. Skipping it is reinventing Bits.

### Alternative 4: Roll custom primitives from scratch

**Pros:**
- Total control. Zero dependency footprint.

**Cons:**
- WAI-ARIA correctness is a year of work to reach parity with Bits UI.
- Focus management edge cases (nested Popovers in Dialogs in Comboboxes) are not solved by reading specs once; they are solved by years of bug reports and fixes against thousands of users.
- Every hour spent on focus traps is an hour not spent on the graph view, the AI co-pilot, the command bar — the things that make Lumen Lumen.

**Why rejected:** We will write our own command bar (it is a product feature). We will not write our own Dialog (it is solved infrastructure).

---

## Implementation Notes

- The wrapper directory `src/lib/components/primitives/` re-exports a curated subset of Bits UI under Lumen-canonical names. Example: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogTitle`, `DialogDescription`, `DialogClose`. Components that map 1:1 to Bits get a thin pass-through; components that need visual defaults (a backdrop, padding, motion) wrap with snippets.
- Theme application is via `data-theme` on `<html>` (per `ARCHITECTURE.md` §8.4). All primitive styles read CSS custom properties, never literal OKLCH values, so the same component renders correctly under all three themes.
- Animation defaults follow `prefers-reduced-motion`. Dialog open/close uses Svelte transitions for minor motion; the graph view and focus mode use Motion GPU shaders (out of scope for primitives).
- The Phase 5 validation surface (Superforms + Valibot) integrates with Bits UI's form primitives via shared `aria-invalid` and `aria-describedby` wiring. Wrapper components handle this so feature code never types ARIA attributes by hand.
- A `keyboard-ergonomics` audit is performed at the end of Phase 6: every primitive in use is exercised with keyboard only, screen reader on, and `prefers-reduced-motion` enabled. Findings land as issues to fix before v1.0.0.
- New primitives outside Bits UI's surface (Command Bar, Split Pane, File Dropzone, Slash Menu, Inline Editor) live in `src/lib/components/` and are documented with the same wrapper pattern, plus an explicit ARIA conformance note per component.

---

## References

- [Bits UI documentation](https://www.bits-ui.com)
- [Melt UI builders](https://www.melt-ui.com/docs/builders)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- Related: [ADR-001: Meta-framework — SvelteKit 2](./001-meta-framework-sveltekit.md)
- Related: `ARCHITECTURE.md` §8 Frontend Architecture
- Related: `LUMEN_VISION.md` § Visual Identity, § Forbidden Patterns

---

## Review & Revision History

| Date | Author | Change |
|---|---|---|
| 2026-04-24 | @billyribeiro-ux | Initial draft — accepted |
