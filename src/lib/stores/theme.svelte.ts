// Theme rune store — three themes (Obsidian / Parchment / Nord-PE7).
//
// Active theme persists to localStorage under `lumen.theme`. The server
// renders <html data-theme="..."> from the user-preference cookie before
// hydration, so theme switching is FOUC-free.

import { browser } from '$app/environment';

export const THEMES = ['obsidian', 'parchment', 'nord-pe7'] as const;
export type ThemeName = (typeof THEMES)[number];

const STORAGE_KEY = 'lumen.theme';
const DEFAULT_THEME: ThemeName = 'obsidian';

const isThemeName = (s: unknown): s is ThemeName =>
  typeof s === 'string' && (THEMES as readonly string[]).includes(s);

class ThemeStore {
  current = $state<ThemeName>(DEFAULT_THEME);

  init(initial: ThemeName | null) {
    this.current = initial ?? this.readFromStorage() ?? DEFAULT_THEME;
    this.apply();
  }

  set(name: ThemeName) {
    this.current = name;
    if (browser) {
      try {
        localStorage.setItem(STORAGE_KEY, name);
      } catch {
        // ignore quota / private mode failures
      }
      document.cookie = `lumen.theme=${name}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    }
    this.apply();
  }

  cycle(): ThemeName {
    const idx = THEMES.indexOf(this.current);
    const next = THEMES[(idx + 1) % THEMES.length] ?? DEFAULT_THEME;
    this.set(next);
    return next;
  }

  private readFromStorage(): ThemeName | null {
    if (!browser) return null;
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return isThemeName(v) ? v : null;
    } catch {
      return null;
    }
  }

  private apply() {
    if (browser) document.documentElement.dataset['theme'] = this.current;
  }
}

export const theme = new ThemeStore();
