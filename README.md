<div align="center">

# Lumen

### Your second brain, lit.

A keyboard-driven knowledge OS for builders — where your code, docs, decisions, and daily work live in one graph, so nothing you learn ever gets lost and nothing you build ever gets rebuilt.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Built with SvelteKit](https://img.shields.io/badge/Built%20with-SvelteKit-FF3E00.svg)](https://svelte.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6.svg)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10.x-F69220.svg)](https://pnpm.io)

[Website](https://lumen.so) · [Documentation](./docs) · [Roadmap](./ROADMAP.md) · [Changelog](./CHANGELOG.md)

</div>

---

## Overview

Lumen is a personal knowledge operating system built for engineers, founders, and builders who think in systems. Notes, tasks, decisions, specs, code snippets, daily logs, and contacts all live as **Nodes** in a single bidirectionally-linked graph. Everything is keyboard-first. Nothing is locked in.

Think **Linear × Obsidian × Raycast**, built by a principal engineer for principal engineers.

## Why Lumen

Engineers generate enormous amounts of valuable context every day — architectural decisions, hard-won debugging insights, code patterns, meeting notes, half-formed ideas. Most of it evaporates. Lumen captures it, links it, and makes it instantly retrievable.

- **Capture at the speed of thought.** Global hotkey from anywhere on your desktop.
- **Everything is linked.** Bidirectional links, typed relations, full-text search across your entire graph.
- **Decisions are first-class.** Architecture Decision Records (ADRs) built into the product.
- **Snippets with purpose.** Language-aware code library, syntax-highlighted, one-keystroke copy.
- **AI that actually knows you.** The co-pilot is grounded in your own knowledge graph — private, contextual, useful.
- **Keyboard-first.** Every action has a shortcut. The mouse is optional.
- **Yours forever.** Full export. Offline-first on desktop. Your data, your graph, your OS.

## Feature Highlights

| Feature | Shortcut | Description |
|---|---|---|
| Command Bar | `⌘K` | Fuzzy search across every node, action, and setting |
| Graph View | `⌘G` | WebGPU-rendered force-directed graph of your knowledge |
| Daily Note | `⌘D` | Auto-created daily log with standing templates |
| Quick Capture | `⌥Space` | Global hotkey — summon Lumen from anywhere (desktop) |
| Split Panes | `⌘\` | Up to 4 keyboard-focusable panes |
| AI Co-Pilot | `⌘J` | Chat grounded in your personal knowledge graph |
| Focus Mode | `⌘.` | Distraction-free writing with ambient GPU shader |
| Publish | `⌘⇧P` | One-keystroke public sharing with custom subdomain |

Full shortcut reference: [docs/shortcuts.md](./docs/shortcuts.md)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | SvelteKit 2.57 + Svelte 5.55 (runes-only) |
| Language | TypeScript (strict) |
| Database | Neon Postgres + Drizzle ORM |
| Authentication | Better Auth (passkeys + 2FA) |
| Validation | Valibot + sveltekit-superforms |
| Payments | Stripe (dynamic pricing from DB) |
| UI Primitives | Bits UI |
| Styling | PE7 CSS Architecture (OKLCH, logical properties, zero Tailwind) |
| Icons | Iconify (Phosphor + Carbon) |
| Animation | GSAP + Motion GPU (WebGPU shaders) + svelte/motion |
| Email | Resend |
| Desktop | Tauri 2 |
| Deployment | Vercel |
| Package Manager | pnpm 10.x |
| Linter / Formatter | Biome |
| Testing | Vitest + Playwright |
| Observability | Sentry + OpenTelemetry |

Architecture deep-dive: [ARCHITECTURE.md](./ARCHITECTURE.md)

## Getting Started

### Prerequisites

- **Node.js** 22 LTS or higher
- **pnpm** 10.x (`corepack enable` or `brew install pnpm`)
- **A Neon Postgres database** ([neon.tech](https://neon.tech))
- **Stripe account** (test mode for development)
- **Resend account** (for transactional email)

### Installation

Full phase-by-phase installation is documented in [INSTALLATION.md](./INSTALLATION.md).

Quick start:

\`\`\`bash
# Clone the repository
git clone https://github.com/billyribeiro-ux/lumen.git
cd lumen

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Fill in DATABASE_URL, STRIPE_SECRET_KEY, RESEND_API_KEY, etc.

# Run database migrations
pnpm db:migrate

# Seed development data
pnpm db:seed

# Start the dev server
pnpm dev
\`\`\`

The app will be available at \`http://localhost:5173\`.

## Project Structure

\`\`\`
lumen/
├── .github/              # GitHub workflows, templates
├── docs/
│   ├── adr/             # Architecture Decision Records
│   ├── runbooks/        # Operational runbooks
│   └── api/             # API documentation
├── src/
│   ├── lib/
│   │   ├── server/      # Server-only modules (db, auth, billing)
│   │   ├── components/  # Svelte components
│   │   ├── stores/      # Runes-based state modules (.svelte.ts)
│   │   └── styles/      # PE7 CSS tokens, layers, utilities
│   ├── routes/          # SvelteKit routes
│   ├── hooks.server.ts
│   └── app.d.ts
├── drizzle/             # Migrations + seed scripts
├── src-tauri/           # Tauri 2 desktop app (Rust)
├── tests/
│   ├── e2e/             # Playwright
│   └── unit/            # Vitest
└── static/              # Public assets
\`\`\`

## Development Workflow

Lumen is built using the **PE7 12-Phase Topological Dependency Chain**:

\`\`\`
Phase 0  → Foundation & Environment
Phase 1  → Database Schema
Phase 2  → Database Seeding
Phase 3  → Authentication
Phase 4  → RBAC & Permissions
Phase 5  → Validation & Security
Phase 6  → Core CRUD
Phase 7  → Email Service
Phase 8  → Stripe Foundation
Phase 9  → Billing Services
Phase 10 → Stripe & Plan Seeding
Phase 11 → Pricing Page & Checkout
Phase 12 → Customer Portal
Phase 13 → Tier-Based Access Control
Phase 14 → Testing
Phase 15 → Tauri 2 Desktop App
\`\`\`

Each phase is a hard topological dependency of the next. Phases are never skipped.

## Documentation

- [README.md](./README.md) — This file
- [INSTALLATION.md](./INSTALLATION.md) — Phase-by-phase setup
- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design and decisions
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Contribution guidelines
- [SECURITY.md](./SECURITY.md) — Security policy and vulnerability reporting
- [CHANGELOG.md](./CHANGELOG.md) — Release history
- [ROADMAP.md](./ROADMAP.md) — Public roadmap
- [docs/adr/](./docs/adr/) — Architecture Decision Records
- [docs/runbooks/](./docs/runbooks/) — Operational runbooks

## License

MIT © [Billy Ribeiro](https://github.com/billyribeiro-ux)

See [LICENSE](./LICENSE) for full text.

---

<div align="center">
<sub>Built with the PE7 Architecture standard — production-grade code, zero shortcuts, 10-year longevity.</sub>
</div>
