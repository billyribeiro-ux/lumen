// Lumen AI co-pilot — Anthropic Claude client.
//
// Uses prompt caching on the system prompt + retrieved context block so
// the per-request cost is bounded by user-message size after a 5-minute
// cache warm-up. See https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching

import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env['ANTHROPIC_API_KEY'];
const isProduction = process.env['NODE_ENV'] === 'production';

if (isProduction && !apiKey) {
  throw new Error('ANTHROPIC_API_KEY is required in production.');
}

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
