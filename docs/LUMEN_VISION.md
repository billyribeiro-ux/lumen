# Lumen — Product Vision & Complete Specification

> **Purpose:** This document captures every product decision, feature detail, visual direction, and UX nuance that defines Lumen. Read this in full before writing any UI code. This is the north star.
> **Status:** Source of truth for product intent. Updated only when product direction changes.
> **Last updated:** 2026-04-24

---

## The One-Liner

**Lumen is where your code, docs, decisions, and daily work live in one keyboard-first graph — so nothing you learn ever gets lost, and nothing you build ever gets rebuilt.**

## Tagline

**Your second brain, lit.**

## Target User

Senior engineers, principal engineers, tech leads, founders, and indie hackers who think in systems. People who have knowledge scattered across Notion, Obsidian, scratch files, Slack DMs, and their own head — and are tired of rebuilding context every time they switch projects.

## Market Positioning

"Linear meets Obsidian meets Raycast, built by a principal engineer for principal engineers."

## Non-Goals

- Not replacing your IDE.
- Not replacing Git or GitHub.
- Not a chat app.
- Not an email client.
- Not chasing feature parity with Notion.
- Not real-time collaborative until v2 (Studio tier).

---

## The Core Metaphor

Everything in Lumen is a **Node**. Nodes connect via bidirectional links. The graph is the product.

### Node Types

- **Note** — long-form markdown content
- **Task** — actionable item with state
- **Decision** — ADR-style (Context → Options → Decision → Consequences)
- **Spec** — technical specification document
- **Snippet** — code block with language + tags
- **Link** — external URL with preview
- **Person** — contacts (attorneys, doctors, collaborators)
- **Project** — container for related nodes
- **Daily** — today's log, auto-created

### Connection Types

Nodes connect via typed relationships:
- `references` — wiki-style `[[node-name]]` mention
- `blocks` — this node blocks that node
- `related` — general relation
- `supersedes` — this replaces that
- `derives_from` — this was built from that
- `embeds` — this embeds that inline

### Tags

Hashtag-style (`#pe7`, `#stack-x`, `#decision-log`). Org-scoped, autocomplete, filterable.

---

## Complete Keyboard Shortcut Map

| Shortcut | Action |
|---|---|
| `⌘K` | Command bar — fuzzy search everything |
| `⌘O` | Quick open — fuzzy file finder |
| `⌘P` | Switch project |
| `⌘N` | New node |
| `⌘⇧N` | Quick capture to inbox |
| `⌘D` | Today's daily note |
| `⌘T` | Timeline view |
| `⌘G` | Graph view |
| `⌘I` | Inbox |
| `⌘J` | AI co-pilot |
| `⌘\` | Split pane |
| `⌘1` / `⌘2` / `⌘3` / `⌘4` | Focus pane N |
| `⌘.` | Focus mode (distraction-free) |
| `⌘,` | Settings |
| `⌘S` | Save (auto-save also active) |
| `⌘E` | Toggle edit/preview |
| `⌘⇧F` | Full-text search |
| `⌘⇧S` | Snippet library |
| `⌘⇧D` | New decision (ADR) |
| `⌘⇧P` | Publish node to public URL |
| `⌘B` | Toggle sidebar |
| `⌘/` | Quick help |
| `g d` | Go to dashboard (vim-style) |
| `g i` | Go to inbox |
| `g t` | Go to timeline |
| `[[` | Start bidirectional link in editor |
| `/` | Slash commands in editor |
| `⌥Space` | **Global hotkey** — summon Lumen from anywhere (Tauri desktop only) |

**Design principle:** Every action has a shortcut. The mouse is optional. Shortcuts are discoverable via `⌘/` and surface in the command bar next to each action.

---

## Headline Features (Detailed)

### 1. Command Bar (`⌘K`)

Raycast-grade. Instant fuzzy search across every node, tag, person, setting, and command. Type `>` for commands, `@` for people, `#` for tags, `/` for filters. Arrow keys navigate. Enter opens. `⌘↵` opens in split view. Sub-50ms open latency is a hard performance budget.

### 2. Split Panes (`⌘\`)

Up to 4 panes, VSCode-style resizable. Each pane keyboard-focusable (`⌘1`, `⌘2`, `⌘3`, `⌘4`). Each pane can show any node type or view. Pane state is URL-serializable (shareable).

### 3. Graph View (`⌘G`)

WebGPU-rendered force-directed graph via `@motion-core/motion-gpu`. WGSL fragment shaders produce a subtle glow on nodes and edges. Filter by type, tag, time range, project. Click any node to open it. Hover shows preview. Must sustain 30 FPS with 1,000 nodes on a mid-range laptop. This is a headline demo moment — it needs to feel alive.

### 4. Daily Note (`⌘D`)

Auto-created every day at midnight local time. Template-driven (user configurable). Standing blocks:
- **What I shipped today**
- **What I learned**
- **Decisions made**
- **Open loops**

Every daily note appears in the timeline forever. Daily notes link to any node the user touched that day (auto-backlinked).

### 5. Smart Inbox (`⌘I`)

Capture-first philosophy. `⌘⇧N` from anywhere drops a note in the inbox. On desktop, `⌥Space` does the same from any app. Process later with single-key actions:
- `e` — edit
- `t` — tag
- `m` — move to project
- `x` — archive
- `→` — promote to task

Goal: Inbox Zero for your brain.

### 6. Snippet Library (`⌘⇧S`)

Language-aware code snippets. Shiki syntax highlighting. Tag by language, framework, stack. One-keystroke copy (`y`). Replaces GitHub Gist + scattered markdown notes. Snippets are searchable by language (`language:typescript`), by tag, and by content.

### 7. Decision Log / ADRs (`⌘⇧D`)

Every significant decision: Context → Options → Decision → Consequences → Alternatives Considered. Linked to affected projects and nodes. Immutable once marked "decided" (but supersede-able). This is the engineering diary you've never had time to keep.

### 8. Timeline (`⌘T`)

Chronological scroll of every node touched. Today → yesterday → last week → last month. Filter by project, type, tag. "Find that thing I was working on two Tuesdays ago" in 3 seconds.

### 9. Focus Mode (`⌘.`)

Hides everything except the current node. Typewriter scrolling. Ambient Motion GPU shader background — slow-drifting generative gradient. Subtle, never distracting. `Esc` returns to full UI.

### 10. Quick Capture Global Hotkey (`⌥Space`, Tauri desktop only)

Summons a small capture window from anywhere on the OS. Drop a thought, link, or screenshot. Lands in inbox. Returns focus to previous app. Never lose a thought.

### 11. AI Co-Pilot (`⌘J`)

Chat panel grounded in the user's own knowledge graph. Uses Anthropic Claude (`claude-opus-4-7`). RAG over user's nodes only — private, local-graph-aware.

Sample queries:
- "What did I decide about auth in Stack-X?"
- "Summarize all my decisions this month."
- "Draft a spec for X based on my previous specs."
- "What should I work on today based on my open loops?"

Quota by tier (Free: 0, Pro: 100/mo, Studio: unlimited).

### 12. Publish (`⌘⇧P`)

Any node published to a read-only public URL in one keystroke. Custom subdomain: `<username>.lumen.so`. SEO-optimized. Privacy-respecting analytics (self-hosted). Optional comment threads. This turns Lumen into a publishing platform.

---

## The "Holy Shit" Demo Moments

These are the visceral experiences that make Lumen feel magical. Protect them:

1. **Launch → `⌘K` → type "auth" → 8 nodes across 3 projects appear instantly.** Search IS the product.
2. **`⌘G` → Graph view ignites with Motion GPU shader glow, nodes pulse softly, zoom into a cluster.** People feel this one.
3. **`⌘J` → ask "what should I work on today based on my open loops?" → AI answers using the user's actual knowledge graph.**
4. **`⌥Space` from anywhere on the desktop → capture window slides in, type a thought, `⌘↵`, it's gone.** Raycast-tier delight.
5. **Publish with `⌘⇧P` → shareable URL in clipboard in 200ms.** Friction-free sharing.

---

## Visual Identity

### Themes (3 total, swappable via `⌘,`)

1. **Obsidian** — near-black OLED default, high contrast, deep blacks, electric accent color
2. **Parchment** — warm off-white, JetBrains Mono for reading, subtle amber accents, inspired by classic texts
3. **Nord-PE7** — OKLCH-tuned blue-slate, cool muted tones, Billy's signature palette

All themes use OKLCH tokens defined in `src/lib/styles/tokens.css`. Theme switching is instant, no flash.

### Typography

| Use | Font |
|---|---|
| UI | **Inter** (system-ui fallback) |
| Code | **JetBrains Mono** |
| Reading mode | **Literata** |

All fonts self-hosted. No Google Fonts CDN (privacy + performance).

### Motion

- **Svelte native** (`svelte/transition`, `svelte/motion`, attachments) — 90% of cases
- **GSAP 3** — page transitions, FLIP animations, orchestrated reveals (lazy-loaded)
- **Motion GPU** — focus mode background, graph view, landing page hero shader

Respect `prefers-reduced-motion` on every animation.

### Icons

**Iconify** via `@iconify/svelte`:
- **Phosphor** for UI (buttons, menus, navigation)
- **Carbon** for dense data views (tables, dashboards, admin)

Icons load on demand — no full-library bundle.

---

## Pricing & Tiers

| Tier | Price | Key Features |
|---|---|---|
| **Free** | $0 | 100 nodes, 1 project, no AI, no desktop app, no publish |
| **Pro** | $20/mo | Unlimited nodes + projects, AI co-pilot (100 queries/mo), desktop app, publishing, graph view, snippet library |
| **Studio** | $40/mo | Everything in Pro + unlimited AI + team collaboration (5 seats) + custom subdomain + API access + advanced export |

### Trial

30-day Pro trial on signup. **No card required.** When trial ends, account auto-downgrades to Free.

### Billing Architecture

**Dynamic pricing from the database.** Products and prices live in Postgres. Stripe is a payment processor, not a pricing source. One source of truth, zero dashboard drift. See `ARCHITECTURE.md` §7 for details.

---

## The Desktop App (Tauri 2)

Same SvelteKit build as the web, wrapped in Tauri 2 with native capabilities:

### Native Features

- **Global hotkey** (`⌥Space`) — configurable in settings — summons quick capture from anywhere on the OS
- **System tray menu:**
  - Open Lumen
  - Quick Capture
  - Today's Daily
  - Settings
  - Quit
- **Menu bar app mode** (macOS) — live in the menu bar, click to summon
- **Native notifications** — daily reminders, AI task completions, publish confirmations
- **Deep links** — `lumen://node/<uuid>` opens a specific node from anywhere
- **Auto-updates** — Tauri updater plugin, Ed25519-signed releases
- **File drag-drop** — drop a folder of markdown files → imports as nodes; drop an image → attaches to current node

### Offline-First Sync

Local SQLite mirrors user data. On startup:
1. Push local writes → remote.
2. Pull remote changes → local.
3. Conflict resolution: last-write-wins with version history preserved.

Sync engine lives in Rust (`src-tauri/src/sync/`). Typed IPC surface to the web layer.

### Build Targets

- macOS (Apple Silicon + Intel)
- Windows (x64)
- Linux (AppImage, .deb)

---

## Data Model Summary (22 Tables)

Full schema lives in `src/lib/server/db/schema/`. See `ARCHITECTURE.md` §4 for detail. Tables grouped by domain:

### Auth (4 tables)
`users`, `sessions`, `accounts`, `verification`

### Organizations (3 tables)
`organizations`, `memberships`, `invitations`

### RBAC (3 tables)
`roles`, `permissions`, `role_permissions`

### Content (5 tables)
`nodes`, `node_content`, `node_versions`, `links`, `tags`, `node_tags`

### Satellite Type Tables (5 tables)
`decisions`, `snippets`, `dailies`, `publications`, `inbox_items`

### AI (2 tables)
`ai_conversations`, `ai_messages`

### Billing (6 tables)
`products`, `prices`, `subscriptions`, `invoices`, `payment_methods`, `entitlements`

### System (2 tables)
`audit_log`, `webhook_events`

---

## Branding

| Asset | Detail |
|---|---|
| **Product name** | Lumen |
| **Tagline** | Your second brain, lit. |
| **Primary domain** | `lumen.so` (reserve / acquire before launch) |
| **Logo concept** | Single stylized filament/node glowing, with faint connecting lines teasing the graph |
| **Twitter / X** | `@uselumen` |
| **GitHub org** | `billyribeiro-ux` (solo for now) |
| **Color DNA** | OKLCH blue-slate core with warm amber accent for light mode |

---

## Product Principles

Every feature must pass these:

1. **Does it earn its place?** No feature ships because it's cool. It ships because users need it.
2. **Does it work with keyboard alone?** Mouse is optional. Keyboard is required.
3. **Does it respect the graph?** Everything connects. Nothing is an island.
4. **Does it honor PE7 standards?** Zero shortcuts, 10-year longevity, production-grade from commit one.
5. **Does it keep the build honest?** Schema first, seeding second, auth third. No skipping.

---

## Forbidden Patterns (UI)

- Tailwind CSS — banned
- Emojis in UI — banned (except user-entered content)
- Modals without keyboard escape — banned
- Actions without keyboard shortcuts — banned (command bar discovery minimum)
- Dark patterns — banned (no deceptive trials, no hidden cancels)
- Google Fonts CDN — banned (self-host)
- Third-party analytics with PII — banned

---

## Success Metrics (Post-Launch)

- **Daily active use** — % of users who create or edit a node per day
- **Node count per user** — median growth curve over first 30 days
- **Time to first node** — < 60 seconds from signup
- **Command bar usage** — % of sessions where `⌘K` is used
- **Desktop install rate** — % of Pro+ users who install desktop app within 7 days
- **Trial → Pro conversion** — target 15%+

---

## Name Origin

**Lumen** — the SI unit of luminous flux. Light. Illumination. Your knowledge, lit up.

---

*This document is product truth. When code disagrees with it, the code is wrong — or the doc needs an update (via PR with rationale).*
