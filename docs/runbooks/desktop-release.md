# Runbook — Desktop Release (Tauri 2)

> **Owner:** Desktop layer (Phase 15 / ADR-008).
> **Status:** Scaffold landed; production bundling is a 1.1.x deliverable
> (see Architecture decision below).

---

## What's in `src-tauri/`

```
src-tauri/
├── Cargo.toml              # Rust manifest pinned to Tauri 2 + plugins
├── build.rs                # tauri-build entry
├── tauri.conf.json         # app config — windows, tray, bundles, plugins
├── capabilities/main.json  # default capability allowlist for the main window
├── icons/                  # bundle icons (drop via `pnpm tauri:icon`)
└── src/
    ├── main.rs             # binary entry — calls lumen_lib::run()
    ├── lib.rs              # Tauri builder, plugin registration, hotkey, tray
    └── commands/
        ├── mod.rs
        ├── quick_capture.rs # ⌥Space inbox capture
        ├── sync.rs          # offline-first sync (stubbed for 1.1.0)
        └── tray.rs          # system tray menu + handlers
```

The renderer side lives in:

- `src/lib/desktop/ipc.ts` — typed IPC bridge with web fallbacks.
- `src/lib/components/...` — every Svelte component is target-agnostic;
  desktop-only behaviors are gated on `isTauri()`.

---

## Architectural decision pending: how the desktop loads the UI

Lumen's SvelteKit app is server-rendered (Vercel adapter). Tauri
expects a static `frontendDist` directory for production bundles.
Three viable paths:

1. **Hosted UI, thin wrapper.** Set `tauri.conf.json` `app.windows[0].url`
   to `https://lumen.so` and ship a tiny static loading page as
   `frontendDist`. Auto-updates only push the wrapper. **Pros:** zero
   duplication, instant feature parity. **Cons:** needs network at
   first launch; offline-first sync still works because IPC commands
   live in Rust.
2. **Hybrid: static SPA + remote API.** Build a second SvelteKit
   profile with `@sveltejs/adapter-static` that ships only the
   client-rendered routes, fetching content from `lumen.so`'s API.
   **Pros:** offline shell. **Cons:** maintenance overhead — two
   build configs.
3. **Bundled Node sidecar.** Run the SvelteKit server inside Tauri.
   **Pros:** total parity. **Cons:** heavyweight; defeats the Tauri
   bundle-size advantage we picked over Electron.

**Recommended:** path 1 for v1.1.0 (ship desktop fast), evolve to path
2 in v1.1.x once the offline experience needs more than the Rust IPC
layer can deliver.

The current `tauri.conf.json` points `frontendDist` at
`../build/client` as a placeholder; the production bundle will not
build until Billy chooses a path and we wire the matching SvelteKit
build profile.

---

## Local development

Prerequisites:

```bash
# Rust toolchain
curl https://sh.rustup.rs -sSf | sh
rustup update stable

# macOS: Xcode command-line tools (already installed if you've ever built anything)
xcode-select --install

# Tauri requires WebView2 on Windows; preinstalled on Win11.
```

Once Rust is installed:

```bash
pnpm tauri:icon          # generates all icon sizes from static/favicon.svg
pnpm tauri:dev           # opens a Tauri window pointing at vite dev server
```

The Rust toolchain compiles `src-tauri/`; the SvelteKit dev server runs
in parallel. Hot reload works for the renderer; Rust changes require
the Tauri window to restart.

---

## Building production binaries

```bash
pnpm tauri:build
```

Output:

| Platform | Output |
|---|---|
| macOS (Apple Silicon) | `src-tauri/target/release/bundle/macos/Lumen.app` |
| macOS (Intel) | cross-build via `--target x86_64-apple-darwin` |
| Windows x64 | `src-tauri/target/release/bundle/msi/Lumen_*.msi` |
| Linux | `src-tauri/target/release/bundle/{appimage,deb}/Lumen*` |

Builds are unsigned by default. Code-signing requires:

- **macOS:** Apple Developer account + signing certificate. Set
  `tauri.conf.json` `bundle.macOS.signingIdentity` and notarize via
  `xcrun notarytool`.
- **Windows:** Authenticode certificate. Configure
  `tauri.conf.json` `bundle.windows.wix.certificateThumbprint`.
- **Linux:** No signing infrastructure required; AppImage and `.deb`
  binaries ship as-is.

---

## Auto-updater

Tauri 2's updater verifies binaries with an Ed25519 signature.

```bash
# One-time generation (NEVER commit the private key)
pnpm tauri signer generate -w ~/.lumen/tauri-updater.key
# The public key prints — copy it into tauri.conf.json plugins.updater.pubkey
```

Update flow:

1. Tag a release: `git tag -s v1.1.1 -m 'v1.1.1 — desktop fixes'`.
2. Build all three platforms in CI (a future workflow `desktop-release.yml`).
3. Sign each artifact with the private key.
4. Upload to a CDN-fronted endpoint at
   `https://lumen.so/api/desktop/updates/{target}/{current_version}`
   that returns the JSON manifest Tauri's updater expects.
5. Existing installs poll, verify the signature, and apply on next launch.

A future runbook (`desktop-update-publish.md`) will codify this.

---

## Capabilities + permissions

`src-tauri/capabilities/main.json` is the allowlist for what the main
window can ask of the OS. We grant:

- `core:default`
- `shell:allow-open` (for opening external links)
- `fs:default`, `fs:allow-read-text-file`, `fs:allow-write-text-file`
  (importing markdown folders, exporting graphs)
- `dialog:default`, `notification:default`
- `deep-link:default`, `global-shortcut:default`
- `updater:default`, `store:default`, `sql:default`

Anything beyond this list is a deliberate decision and requires both
a `tauri.conf.json` permission entry AND a security review per
`ARCHITECTURE.md` §12.

---

## Related

- ADR-008 — Desktop: Tauri 2.
- `LUMEN_VISION.md` § The Desktop App — feature list and offline-first
  promise.
- `ARCHITECTURE.md` §9 — Desktop architecture.
- `src/lib/desktop/ipc.ts` — typed IPC bridge with web fallbacks.
