// Lumen AI co-pilot — Anthropic Claude client.
//
// Uses prompt caching on the system prompt + retrieved context block so
// the per-request cost is bounded by user-message size after a 5-minute
// cache warm-up. See https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching

import Anthropic from '@anthropic-ai/sdk';

// Read lazily at first use rather than throwing at module load — eager
// top-level throws break the production build's analyse step, where env
// vars are not injected. `getAnthropic()` fails fast on first real use.
const apiKey = process.env['ANTHROPIC_API_KEY'];

let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!_client) {
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured.');
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export const isAiConfigured = (): boolean => Boolean(apiKey);

export const DEFAULT_MODEL = process.env['ANTHROPIC_MODEL'] ?? 'claude-opus-4-7';
