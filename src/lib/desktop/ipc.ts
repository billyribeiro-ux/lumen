// Tauri IPC client — narrow, typed bridge between the SvelteKit
// renderer and the Rust backend in src-tauri/.
//
// Every function is no-op-on-web: when `isTauri()` is false, the
// helpers either return a sensible default or fall back to the
// equivalent web-only flow. This keeps a single SvelteKit build
// working in both targets.

export const isTauri = (): boolean =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

interface CapturePayload {
  body: string;
  sourceUrl?: string;
}

export interface CaptureResult {
  queued: boolean;
  captureToken: string;
}

export async function submitDesktopCapture(input: CapturePayload): Promise<CaptureResult | null> {
  if (!isTauri()) return null;
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<CaptureResult>('submit_capture', {
    input: {
      body: input.body,
      source_url: input.sourceUrl ?? null,
    },
  });
}

export async function pushDesktopChanges(sessionToken: string, since?: number) {
  if (!isTauri()) return null;
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<{ pushed: number; failed: number }>('push_changes', {
    input: { session_token: sessionToken, since: since ?? null },
  });
}

export async function pullDesktopChanges(sessionToken: string, since?: number) {
  if (!isTauri()) return null;
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<{ pulled: number; conflicts: string[]; last_pulled_at: number }>('pull_changes', {
    input: { session_token: sessionToken, since: since ?? null },
  });
}

/** Subscribe to a Tauri event. Returns an unsubscribe function. */
export async function onDesktopEvent<T = unknown>(
  event: string,
  handler: (payload: T) => void,
): Promise<() => void> {
  if (!isTauri()) return () => {};
  const { listen } = await import('@tauri-apps/api/event');
  const unlisten = await listen<T>(event, (e) => handler(e.payload));
  return unlisten;
}
