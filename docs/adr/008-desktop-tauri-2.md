# ADR-008: Desktop — Tauri 2 over Electron, Neutralino, and native platform builds

**Status:** Accepted
**Date:** 2026-04-24
**Deciders:** @billyribeiro-ux
**Phase:** 0 — Foundation
**Tags:** `desktop`, `tauri`, `architecture`, `foundation`

---

## Context

Lumen ships as both a web app and a desktop app. The desktop build (Phase 15, post-v1.0.0) is not a different product — it is the same SvelteKit application wrapped in a native shell that adds capabilities the browser cannot offer:

- **Global hotkey** (`⌥Space`) — summon a quick-capture window from anywhere on the OS, even when Lumen is not focused. This is one of the five "holy shit" demo moments per `LUMEN_VISION.md` and is the desktop app's core differentiator.
- **System tray menu** with Open / Quick Capture / Today's Daily / Settings / Quit.
- **Menu bar app mode** on macOS — live in the menu bar, click to summon.
- **Native notifications** with OS-level scheduling.
- **Deep links** (`lumen://node/<uuid>`) opening directly into a node from anywhere.
- **Auto-updates** with cryptographically signed binaries.
- **Local-first SQLite mirror** for offline operation, syncing to Neon when online.
- **File drag-drop** that imports a folder of Markdown as nodes or attaches a file to the current node.

Build targets: macOS (Apple Silicon + Intel), Windows x64, Linux (AppImage + .deb).

The desktop wrapper choice constrains the app's bundle size, cold-start latency, OS integration depth, and update story for the next decade. Three realistic candidates were evaluated: Tauri 2, Electron, Neutralino. Native platform builds (separate Swift / WinUI / GTK apps) are the do-nothing alternative.

---

## Decision

**We will use Tauri 2 as Lumen's desktop wrapper.**

Concretely:

- The desktop project lives in `src-tauri/` at the repo root, alongside the SvelteKit `src/`.
- The frontend is the same SvelteKit build deployed to Vercel — produced by `pnpm build` and consumed by Tauri unchanged. There is no parallel desktop codebase.
- The `src-tauri/src/` Rust backend exposes a typed IPC surface (Tauri commands and events) for the capabilities that require native APIs: global hotkey, system tray, notifications, deep links, file system, SQLite sync engine.
- Auto-updates use Tauri's `updater` plugin with **Ed25519-signed releases**. The signing key lives offline; only the public key is committed.
- Build artifacts (`.dmg`, `.msi`, `.AppImage`, `.deb`) are produced by GitHub Actions on tagged releases and published to a CDN-fronted release endpoint (Vercel Blob or similar — the choice is deferred to Phase 15).
- The local SQLite store and its sync engine live in `src-tauri/src/sync/` (Rust). The web layer talks to it via `invoke('sync.push')` / `invoke('sync.pull')` and listens for `sync.changed` events.

---

## Consequences

### Positive

- **Bundle size is one to two orders of magnitude smaller than Electron.** A typical Tauri 2 app on macOS is ~10–20MB; the equivalent Electron app is ~150–250MB. Faster downloads, faster auto-updates, lower hosting cost for binary distribution.
- **Cold start is faster.** Tauri uses the OS's native webview (WebKit on macOS, WebView2 on Windows, WebKitGTK on Linux). No bundled Chromium to spin up.
- **Memory footprint is materially smaller.** A running Tauri app idles at a fraction of an Electron app's RSS. Relevant for menu-bar mode where Lumen runs always-on.
- **Rust backend gives us strong primitives for the sync engine.** SQLite, file-system access, scheduling, and IPC are all expressed in a memory-safe language with strong types, not in JavaScript with C++ addons.
- **Same SvelteKit build powers web + desktop.** No dual codebase. Feature parity is the default; divergence requires a deliberate `if (window.__TAURI__) { ... }` branch.
- **Native tray, menus, notifications, hotkeys** are first-class Tauri APIs with cross-platform abstractions. No platform-specific app-shell code beyond what Tauri itself exposes.
- **Tauri 2's permission system is granular.** Capabilities (filesystem, dialog, notification, global-shortcut, etc.) are declared explicitly per-window in `tauri.conf.json` with allowlists. The default-deny posture aligns with the security model in `ARCHITECTURE.md` §12.
- **Active development by a well-funded team.** Tauri 2.0 shipped late 2024; the project has consistent funding, transparent governance, and a clear roadmap.

### Negative

- **Native webview means platform parity is not perfect.** WebKit on macOS, WebView2 on Windows, and WebKitGTK on Linux all support modern web standards, but each has quirks. Some features (advanced WebGPU paths in particular) may need fallbacks per platform. We accept this; it is not unique to Tauri (Safari quirks affect web users on macOS already).
- **Rust is a learning surface.** Tauri's surface that we touch (commands, events, plugins) is small and well-documented; sync-engine work in Rust is meaningful but bounded. Solo-engineer ramp is real but tractable.
- **Updater requires a hosted release endpoint.** We must operate a small JSON manifest endpoint that the updater polls. Trivial in scope; non-zero in operational responsibility.
- **Plugin maturity varies.** Most first-party Tauri 2 plugins (filesystem, dialog, notification, sql, updater, deep-link, store, global-shortcut) are stable. A few community plugins are not. We will only adopt plugins under the official Tauri organization for v1.1.0.

### Neutral

- Tauri 2 supports mobile (iOS, Android) too. Lumen does not ship mobile at v1; the option remains open.
- Code-signing certificates (Apple Developer + Microsoft Trusted) are external account dependencies that Billy must provision before Phase 15. They are not Tauri-specific — any desktop framework requires them.

---

## Alternatives Considered

### Alternative 1: Electron

**Pros:**
- Largest ecosystem in the desktop-web space.
- Bundled Chromium means rendering parity with the web. Zero cross-platform webview quirks.
- Deepest tooling: electron-builder, electron-forge, electron-updater are mature.
- Massive community knowledge base.

**Cons:**
- ~150–250MB binaries vs Tauri's ~10–20MB. Auto-update bandwidth is materially worse.
- Memory footprint at idle is many times Tauri's. For a menu-bar always-on use case (per `LUMEN_VISION.md` § Desktop App), this is a daily user-experience cost.
- Backend is Node.js, not Rust. The sync engine in JS would need careful concurrency design that Rust gets for free.
- Security posture is "deny by patching the surface" rather than Tauri's "deny by default, allowlist what you need." More attack surface; more configuration to keep tight.
- Application-startup time on cold launch is longer because Chromium must initialize.

**Why rejected:** The user-facing cost (binary size, RAM, startup time) is the cost we will not pay daily for the rest of the product's life. Electron is the safe choice that consigns Lumen to a heavier-than-needed desktop footprint forever.

### Alternative 2: Neutralino

**Pros:**
- Even lighter than Tauri.
- Pure C++ backend; no Rust learning curve.
- Simple architecture.

**Cons:**
- Smaller ecosystem; many capabilities Lumen needs (auto-updater, deep links, SQL plugin parity, signed releases) are either DIY or not as polished.
- Smaller community; fewer real-world production deployments to validate against.
- Less active development cadence than Tauri.

**Why rejected:** Tauri's ecosystem and governance are decisively further along. Neutralino is the right answer for a smaller surface than Lumen needs.

### Alternative 3: Native platform builds (Swift on macOS, WinUI on Windows, GTK on Linux)

**Pros:**
- Maximum native fidelity. Best-possible OS integration.
- Smallest possible binaries.
- No webview compromises.

**Cons:**
- Three separate codebases. Any feature lands three times. Solo engineer + greenfield = not shipping.
- The web app exists. It is the product. A second product written in three more languages is a different company, not a desktop strategy.
- Code reuse for business logic is weak.

**Why rejected:** The premise of the desktop strategy is "same SvelteKit build, additional capabilities." Native rewrites violate that premise.

### Alternative 4: Do nothing (web-only)

**Pros:**
- Zero desktop maintenance burden.
- Browsers are catching up on capabilities (PWA, File System Access API).

**Cons:**
- No global hotkey from outside the browser. The `⌥Space` quick-capture experience is impossible in a browser tab.
- No system tray. No menu bar app mode. No deep links from outside the browser. No native notifications (PWA notifications are a partial solution).
- No offline-first SQLite mirror at parity with desktop.
- The desktop entitlement is a real Pro-tier value (per `LUMEN_VISION.md` Pricing). Removing it weakens the conversion story.

**Why rejected:** The desktop app is a product feature, not an infrastructure indulgence. Skipping it would be skipping a tier-defining capability.

---

## Implementation Notes

- The desktop project does not exist in the repo until Phase 15. ADR is written now to lock the decision and to constrain Phase 1's schema work — specifically, the `nodes` schema must be designed to support the offline sync engine's last-write-wins + version-history model.
- The sync engine's wire protocol is a typed IPC surface. The web layer imports a generated TypeScript binding (`src/lib/desktop/ipc.ts`) that mirrors the Rust commands / events. Bindings are generated by Tauri's `specta` integration and committed to the repo for review.
- The desktop entitlement (`can_use_desktop`) is enforced at the auto-updater handshake. A free-tier user attempting to install the desktop app will be denied an update manifest. This is enforcement at the right layer — the binary itself is freely distributable; only authenticated update-eligible users receive updates.
- Apple notarization, Microsoft code-signing, and Linux package signing are external account dependencies that Billy must provision. Documented in `docs/runbooks/desktop-release.md` (lands in Phase 15).
- The `lumen://` deep-link scheme is registered per platform via Tauri's deep-link plugin. URL parsing and routing happen in the SvelteKit layer using the same router that serves web URLs.
- Auto-update Ed25519 signing key is generated once and stored offline (1Password, hardware security module, or both). The public key is committed to `tauri.conf.json`. Loss of the private key requires shipping a new public key in a manual update — operationally painful but tractable.

---

## References

- [Tauri 2 documentation](https://v2.tauri.app)
- [Tauri 2 plugin catalog](https://v2.tauri.app/plugin/)
- [Tauri vs Electron benchmarks](https://v2.tauri.app/concept/process-model/)
- [Tauri capability system](https://v2.tauri.app/security/capabilities/)
- Related: [ADR-001: Meta-framework — SvelteKit 2](./001-meta-framework-sveltekit.md)
- Related: `ARCHITECTURE.md` §9 Desktop Architecture
- Related: `LUMEN_VISION.md` § The Desktop App

---

## Review & Revision History

| Date | Author | Change |
|---|---|---|
| 2026-04-24 | @billyribeiro-ux | Initial draft — accepted |
