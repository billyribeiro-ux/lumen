<script lang="ts">
  import Icon from '@iconify/svelte';
  import UpgradePrompt from '$lib/components/patterns/UpgradePrompt.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    citedSlugs?: string[];
  }

  let conversationId = $state<string | null>(null);
  let messages = $state<ChatMessage[]>([]);
  let input = $state('');
  let pending = $state(false);
  let error = $state<string | null>(null);

  const aiAllowed = $derived(
    Boolean(data.entitlements && data.entitlements.aiQueriesPerMonth !== 0),
  );

  async function send() {
    const message = input.trim();
    if (!message || pending) return;
    pending = true;
    error = null;
    messages = [...messages, { role: 'user', content: message }];
    input = '';

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ conversationId, message }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        error = payload.error ?? 'AI request failed.';
        return;
      }
      const payload = (await res.json()) as {
        conversationId: string;
        assistantText: string;
        citedSlugs: string[];
      };
      conversationId = payload.conversationId;
      messages = [
        ...messages,
        {
          role: 'assistant',
          content: payload.assistantText,
          citedSlugs: payload.citedSlugs,
        },
      ];
    } catch (e) {
      error = e instanceof Error ? e.message : 'Network error.';
    } finally {
      pending = false;
    }
  }

  function handleKey(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      send();
    }
  }
</script>

<svelte:head>
  <title>AI co-pilot — Lumen</title>
</svelte:head>

<section class="copilot">
  <header>
    <h1><Icon icon="ph:sparkle-fill" inline width="22" /> AI co-pilot</h1>
    <p>Grounded in your nodes. Use slug citations like <code>[my-node-slug]</code>.</p>
  </header>

  {#if !aiAllowed}
    <UpgradePrompt
      feature="AI co-pilot"
      tier="pro"
      description="Pro includes 100 queries/month. Studio is unlimited."
    />
  {:else if !data.aiConfigured}
    <p class="warn">
      AI is not configured for this environment. Set <code>ANTHROPIC_API_KEY</code> in
      <code>.env</code>.
    </p>
  {:else}
    <div class="chat">
      {#each messages as m, i (i)}
        <article class="msg msg-{m.role}">
          <div class="role">{m.role === 'user' ? 'You' : 'Lumen'}</div>
          <div class="bubble">{m.content}</div>
          {#if m.role === 'assistant' && m.citedSlugs?.length}
            <div class="cited">
              {#each m.citedSlugs as slug (slug)}
                <a href={`/n/${slug}`}>[{slug}]</a>
              {/each}
            </div>
          {/if}
        </article>
      {/each}
      {#if pending}
        <article class="msg msg-assistant">
          <div class="role">Lumen</div>
          <div class="bubble pending">Thinking…</div>
        </article>
      {/if}
    </div>

    {#if error}
      <p class="err" role="alert">{error}</p>
    {/if}

    <form
      class="composer"
      onsubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <textarea
        rows="3"
        placeholder="Ask anything about your graph. ⌘↵ to send."
        bind:value={input}
        onkeydown={handleKey}
      ></textarea>
      <button type="submit" disabled={pending || !input.trim()}>
        <Icon icon="ph:paper-plane-tilt-fill" width="14" /> Send
      </button>
    </form>

    {#if data.conversations.length > 0}
      <aside class="history">
        <h2>Recent conversations</h2>
        <ul>
          {#each data.conversations as c (c.id)}
            <li>
              <button type="button" onclick={() => (conversationId = c.id)}>
                {c.title}
              </button>
              <small>{new Date(c.lastMessageAt).toLocaleDateString()}</small>
            </li>
          {/each}
        </ul>
      </aside>
    {/if}
  {/if}
</section>

<style>
  .copilot {
    inline-size: min(48rem, 100%);
    margin-inline: auto;
    padding-block: var(--space-6);
    display: grid;
    gap: var(--space-4);
  }
  h1 {
    font-size: var(--text-2xl);
    margin: 0;
  }
  header p {
    color: var(--color-text-muted);
  }
  code {
    font-family: var(--font-mono);
    font-size: 0.9em;
    background: var(--color-surface);
    padding-inline: 0.3rem;
    border-radius: var(--radius-1);
  }
  .chat {
    display: grid;
    gap: var(--space-3);
    min-block-size: 16rem;
  }
  .msg {
    display: grid;
    gap: 0.25rem;
  }
  .role {
    font-size: var(--text-2xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-subtle);
  }
  .bubble {
    padding: 0.625rem 0.875rem;
    border-radius: var(--radius-3);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    white-space: pre-wrap;
    line-height: 1.6;
  }
  .msg-user .bubble {
    background: color-mix(in oklch, var(--color-accent) 15%, var(--color-surface));
    border-color: color-mix(in oklch, var(--color-accent) 35%, transparent);
  }
  .pending {
    color: var(--color-text-subtle);
  }
  .cited {
    display: flex;
    gap: 0.375rem;
    flex-wrap: wrap;
    font-family: var(--font-mono);
    font-size: var(--text-2xs);
  }
  .cited a {
    color: var(--color-accent);
    text-decoration: none;
  }
  .err {
    color: var(--color-danger);
    font-size: var(--text-sm);
  }
  .composer {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.5rem;
    align-items: end;
  }
  .composer textarea {
    grid-column: 1 / -1;
    padding: 0.625rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2);
    background: var(--color-background);
    color: inherit;
    font: inherit;
    font-family: var(--font-mono);
    resize: vertical;
  }
  .composer button {
    justify-self: end;
    grid-column: 2;
    grid-row: 1;
    padding-inline: 1rem;
    padding-block: 0.5rem;
    border-radius: var(--radius-2);
    border: 1px solid transparent;
    background: var(--color-accent);
    color: var(--color-accent-text);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
  .composer button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .history {
    border-block-start: 1px solid var(--color-border);
    padding-block-start: var(--space-3);
  }
  .history h2 {
    font-size: var(--text-sm);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-subtle);
  }
  .history ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.4rem;
  }
  .history li {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  .history button {
    background: transparent;
    border: 0;
    color: var(--color-accent);
    text-align: start;
    cursor: pointer;
    padding: 0;
    font: inherit;
  }
  .history small {
    color: var(--color-text-subtle);
    font-size: var(--text-xs);
  }
  .warn {
    color: var(--color-warning);
    font-size: var(--text-sm);
  }
</style>
