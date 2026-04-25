# Lumen — Keyboard Shortcuts

> Lumen is keyboard-first. Every action has a shortcut. The mouse is optional.
> Discover any shortcut from inside the app via the command bar (`⌘K`) or the help overlay (`⌘/`).

---

## Navigation

| Shortcut | Action |
|---|---|
| `⌘K` | Command bar — fuzzy search everything |
| `⌘O` | Quick open — fuzzy file finder |
| `⌘P` | Switch project |
| `⌘⇧F` | Full-text search |
| `⌘B` | Toggle sidebar |
| `⌘,` | Settings |
| `⌘/` | Quick help / shortcut reference |

## Vim-style Navigation

| Shortcut | Action |
|---|---|
| `g d` | Go to dashboard |
| `g i` | Go to inbox |
| `g t` | Go to timeline |

## Creation & Capture

| Shortcut | Action |
|---|---|
| `⌘N` | New node |
| `⌘⇧N` | Quick capture to inbox |
| `⌘D` | Today's daily note |
| `⌘⇧D` | New decision (ADR) |
| `⌥Space` | **Global hotkey** — summon Lumen from anywhere (Tauri desktop only) |

## Views

| Shortcut | Action |
|---|---|
| `⌘G` | Graph view (WebGPU-rendered) |
| `⌘T` | Timeline view |
| `⌘I` | Inbox |
| `⌘⇧S` | Snippet library |
| `⌘.` | Focus mode (distraction-free) |

## Panes

| Shortcut | Action |
|---|---|
| `⌘\` | Split pane (up to 4) |
| `⌘1` | Focus pane 1 |
| `⌘2` | Focus pane 2 |
| `⌘3` | Focus pane 3 |
| `⌘4` | Focus pane 4 |

## Editing

| Shortcut | Action |
|---|---|
| `⌘S` | Save (auto-save also active) |
| `⌘E` | Toggle edit/preview |
| `[[` | Start bidirectional link in editor |
| `/` | Slash commands in editor |

## Sharing & AI

| Shortcut | Action |
|---|---|
| `⌘J` | AI co-pilot |
| `⌘⇧P` | Publish node to public URL |

---

## Inbox Processing (single-key actions)

When focused on an inbox item:

| Key | Action |
|---|---|
| `e` | Edit |
| `t` | Tag |
| `m` | Move to project |
| `x` | Archive |
| `→` | Promote to task |
| `y` | Copy snippet (in snippet library) |

---

## Customization

Future: shortcut overrides will be configurable per user via `/account/shortcuts`. For v1, the defaults above are fixed.

## Conflicts

Lumen detects shortcut conflicts at registration time and refuses to register a duplicate binding. If you find a conflict, file a bug.

## Platform Notes

- `⌘` is the Command key on macOS, Control on Windows/Linux. Lumen renders the appropriate symbol per platform.
- `⌥` is Option on macOS, Alt on Windows/Linux.
- The `⌥Space` global hotkey is **desktop-only** (requires Tauri). Web users do not have this shortcut.
