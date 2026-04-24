## Summary

<!-- 1-3 sentences describing what this PR does. -->

## Motivation

<!-- Why is this change needed? What problem does it solve?
     Link to the issue, discussion, ADR, or user story if applicable. -->

Closes #

## Changes

<!-- Bullet list of concrete changes. One bullet per logical change. -->

-
-
-

## Approach

<!-- Briefly describe the approach taken.
     If you considered alternatives, mention them and explain why this approach won. -->

## Testing

<!-- How was this change verified? Check all that apply. -->

- [ ] Unit tests added / updated
- [ ] Integration tests added / updated
- [ ] E2E tests added / updated
- [ ] Manually tested in dev (`pnpm dev`)
- [ ] Manually tested in production build (`pnpm build && pnpm preview`)
- [ ] Tested on desktop (Tauri) — if relevant
- [ ] Accessibility checked (keyboard nav, screen reader, contrast)

### Test Evidence

<!-- Paste screenshots, recordings, or terminal output that prove the change works. -->

## Screenshots / Recordings

<!-- For UI changes, include before/after screenshots or a short screen recording. -->

|          | Before | After |
| -------- | ------ | ----- |
| Desktop  |        |       |
| Mobile   |        |       |

## Breaking Changes

<!-- Does this PR introduce any breaking changes? -->

- [ ] No breaking changes
- [ ] Yes — breaking changes are described below

### Migration Path

<!-- If breaking changes exist, describe exactly what users must do to migrate. -->

## Performance Impact

<!-- Does this change affect performance? Bundle size? Database query cost? -->

- [ ] No measurable impact
- [ ] Neutral or positive (explain below)
- [ ] Negative (justified below)

## Security Considerations

<!-- Authentication, authorization, data exposure, new dependencies, secrets handling. -->

- [ ] No security implications
- [ ] Security-relevant — reviewed against SECURITY.md
- [ ] New dependency added — vetted with `pnpm audit` and reviewed manually

## Documentation

<!-- Check every doc that was updated as part of this PR. -->

- [ ] `README.md` updated (if user-facing)
- [ ] `CHANGELOG.md` `[Unreleased]` section updated
- [ ] New ADR added under `docs/adr/` (if architectural decision)
- [ ] Runbook added / updated under `docs/runbooks/` (if operational)
- [ ] `.env.example` updated (if new env var)
- [ ] Inline code comments added for non-obvious logic

## Pre-Flight Checklist

<!-- Complete before requesting review. -->

- [ ] Branch rebased onto latest `develop`
- [ ] Commits follow Conventional Commits (`feat:`, `fix:`, `chore:`, etc.)
- [ ] `pnpm lint` passes
- [ ] `pnpm check` passes (TypeScript strict, zero errors)
- [ ] `pnpm test` passes
- [ ] `pnpm build` succeeds
- [ ] No `console.log`, no `@ts-ignore`, no `any` types
- [ ] No secrets, keys, or credentials in the diff
- [ ] PR title follows Conventional Commits format

## PE7 Phase

<!-- Which build phase does this PR belong to? -->

- [ ] Phase 0 — Foundation
- [ ] Phase 1 — Schema
- [ ] Phase 2 — Seeding
- [ ] Phase 3 — Auth
- [ ] Phase 4 — RBAC
- [ ] Phase 5 — Validation
- [ ] Phase 6 — CRUD
- [ ] Phase 7 — Email
- [ ] Phase 8 — Stripe Foundation
- [ ] Phase 9 — Billing Services
- [ ] Phase 10 — Stripe Seeding
- [ ] Phase 11 — Checkout
- [ ] Phase 12 — Customer Portal
- [ ] Phase 13 — Tier Access
- [ ] Phase 14 — Testing
- [ ] Phase 15 — Desktop (Tauri 2)
- [ ] Cross-cutting / Post-launch
