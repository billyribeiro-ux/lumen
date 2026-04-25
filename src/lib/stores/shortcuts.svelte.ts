// Lumen keyboard shortcut registry.
//
// Single global dispatcher. Components register commands; commands have
// an id, description, default keybinding, scope, and handler. The
// keyboard handler in `attach()` listens once on `window` and routes
// events to the matching command.
//
// Keybindings use the `KeyChord` syntax — capital letters allowed,
// modifiers prefixed with + (Mod+K, Mod+Shift+P, etc). `Mod` is ⌘ on
// macOS and Ctrl elsewhere.

import { browser } from '$app/environment';

export interface CommandDef {
  id: string;
  description: string;
  keybinding: string;
  /** When true, command runs only inside contenteditable / textarea / input contexts. */
  inEditableOnly?: boolean;
  /** When true, prevents propagation/default. Defaults to true. */
  preventDefault?: boolean;
  handler: (event: KeyboardEvent) => void | Promise<void>;
}

const isMac = browser && /(Mac|iPhone|iPad)/i.test(navigator.platform);

const normalizeKey = (key: string): string => {
  switch (key) {
    case ' ':
      return 'Space';
    case 'Escape':
      return 'Esc';
    default:
      return key.length === 1 ? key.toUpperCase() : key;
  }
};

const eventToCanonical = (e: KeyboardEvent): string => {
  const parts: string[] = [];
  if (e.metaKey || e.ctrlKey) parts.push('Mod');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  parts.push(normalizeKey(e.key));
  return parts.join('+');
};

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
};

class ShortcutRegistry {
  private commands = new Map<string, CommandDef>();
  private detach: (() => void) | null = null;

  register(...defs: CommandDef[]): void {
    for (const def of defs) {
      if (this.commands.has(def.id)) {
        // Replacement is allowed (HMR / re-mounts), but log to surface bugs.
        console.warn(`[shortcuts] re-registering ${def.id}`);
      }
      this.commands.set(def.id, def);
    }
  }

  unregister(...ids: string[]): void {
    for (const id of ids) this.commands.delete(id);
  }

  list(): CommandDef[] {
    return Array.from(this.commands.values()).sort((a, b) =>
      a.description.localeCompare(b.description),
    );
  }

  format(keybinding: string): string {
    return keybinding
      .replace(/Mod/g, isMac ? '⌘' : 'Ctrl')
      .replace(/Alt/g, isMac ? '⌥' : 'Alt')
      .replace(/Shift/g, '⇧')
      .replace(/\+/g, isMac ? '' : '+');
  }

  attach(): () => void {
    if (!browser) return () => {};
    const handler = (e: KeyboardEvent) => {
      const canonical = eventToCanonical(e);
      const editable = isEditableTarget(e.target);
      for (const cmd of this.commands.values()) {
        if (cmd.keybinding !== canonical) continue;
        if (cmd.inEditableOnly && !editable) continue;
        if (!cmd.inEditableOnly && editable) {
          // Allow Mod+K and similar inside editable surfaces; everything
          // else is suppressed so typing isn't hijacked.
          if (!cmd.keybinding.startsWith('Mod')) continue;
        }
        if (cmd.preventDefault !== false) {
          e.preventDefault();
          e.stopPropagation();
        }
        void cmd.handler(e);
        return;
      }
    };
    window.addEventListener('keydown', handler, { capture: true });
    this.detach = () => window.removeEventListener('keydown', handler, { capture: true } as never);
    return this.detach;
  }
}

export const shortcuts = new ShortcutRegistry();
