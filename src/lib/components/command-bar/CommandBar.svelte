<script module lang="ts">
  function iconFor(type: string): string {
    switch (type) {
      case 'note':
        return 'ph:note';
      case 'task':
        return 'ph:check-square';
      case 'decision':
        return 'ph:scales';
      case 'spec':
        return 'ph:file-doc';
      case 'snippet':
        return 'ph:code';
      case 'project':
        return 'ph:folders';
      case 'daily':
        return 'ph:sun';
      case 'person':
        return 'ph:user';
      default:
        return 'ph:circle';
    }
  }
</script>

<script lang="ts">
  import { Dialog } from 'bits-ui';
  import Icon from '@iconify/svelte';
  import { goto } from '$app/navigation';
  import { shortcuts } from '$lib/stores/shortcuts.svelte';
  import { theme } from '$lib/stores/theme.svelte';

  interface SearchHit {
    id: string;
    type: string;
    title: string;
    slug: string;
  }

  let open = $state(false);
  let query = $state('');
  let hits = $state<SearchHit[]>([]);
  let activeIndex = $state(0);
  let loading = $state(false);
  let abortController: AbortController | null = null;

  async function runSearch(q: string) {
    abortController?.abort();
    abortController = new AbortController();
    if (!q.trim()) {
      hits = [];
      return;
    }
    loading = true;
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        signal: abortController.signal,
      });
      if (res.ok) hits = await res.json();
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.error(err);
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    runSearch(query);
  });

  function openHit(hit: SearchHit) {
    open = false;
    goto(`/n/${hit.slug}`);
  }

  function move(delta: number) {
    if (hits.length === 0) return;
    activeIndex = (activeIndex + delta + hits.length) % hits.length;
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(-1);
    } else if (e.key === 'Enter') {
      const hit = hits[activeIndex];
      if (hit) {
        e.preventDefault();
        openHit(hit);
      }
    }
  }

  $effect(() => {
    const detach = shortcuts.attach();
    shortcuts.register(
      {
        id: 'cmd.bar.open',
        description: 'Open command bar',
        keybinding: 'Mod+K',
        handler: () => {
          open = true;
        },
      },
      {
        id: 'cmd.theme.cycle',
        description: 'Cycle theme',
        keybinding: 'Mod+Shift+T',
        handler: () => {
          theme.cycle();
        },
      },
      {
        id: 'cmd.node.new',
        description: 'New node',
        keybinding: 'Mod+N',
        handler: () => goto('/n/new'),
      },
      {
        id: 'cmd.help.shortcuts',
        description: 'Show keyboard shortcuts',
        keybinding: 'Mod+/',
        handler: () => goto('/help/shortcuts'),
      },
    );
    return detach;
  });

  $effect(() => {
    if (!open) {
      query = '';
      hits = [];
      activeIndex = 0;
    }
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="cmd-overlay" />
    <Dialog.Content class="cmd-content">
      <Dialog.Title class="visually-hidden">Command bar</Dialog.Title>
      <div class="cmd-bar">
        <Icon icon="ph:magnifying-glass" width="18" />
        <!-- svelte-ignore a11y_autofocus -->
        <input
          type="text"
          placeholder="Search nodes, run commands…"
          bind:value={query}
          onkeydown={handleKey}
          autocomplete="off"
          spellcheck="false"
          autofocus
        />
        {#if loading}
          <span class="cmd-loading" aria-hidden="true">…</span>
        {/if}
      </div>
      <ul class="cmd-results" role="listbox">
        {#each hits as hit, i (hit.id)}
          <li role="option" aria-selected={i === activeIndex} class:active={i === activeIndex}>
            <button
              type="button"
              class="cmd-row"
              onmouseenter={() => (activeIndex = i)}
              onclick={() => openHit(hit)}
            >
              <Icon icon={iconFor(hit.type)} width="16" />
              <span class="cmd-title">{hit.title}</span>
              <span class="cmd-type">{hit.type}</span>
            </button>
          </li>
        {/each}
        {#if !loading && query && hits.length === 0}
          <li class="cmd-empty">No matches.</li>
        {/if}
      </ul>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  :global(.cmd-overlay) {
    position: fixed;
    inset: 0;
    background: oklch(0 0 0 / 0.5);
    backdrop-filter: blur(8px);
    z-index: 50;
  }
  :global(.cmd-content) {
    position: fixed;
    inset-block-start: 12vh;
    inset-inline-start: 50%;
    transform: translateX(-50%);
    inline-size: min(36rem, 100% - 2rem);
    background: var(--color-surface-raised);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-3);
    box-shadow: 0 30px 60px -15px oklch(0 0 0 / 0.5);
    z-index: 60;
    overflow: hidden;
  }
  :global(.visually-hidden) {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }
  .cmd-bar {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding-inline: var(--space-4);
    padding-block: 0.875rem;
    border-block-end: 1px solid var(--color-border);
  }
  .cmd-bar input {
    flex: 1;
    background: transparent;
    border: 0;
    color: inherit;
    font-size: var(--text-base);
  }
  .cmd-bar input:focus-visible {
    outline: none;
  }
  .cmd-loading {
    font-size: var(--text-sm);
    color: var(--color-text-subtle);
  }
  .cmd-results {
    list-style: none;
    padding: 0.375rem;
    margin: 0;
    max-block-size: 50vh;
    overflow-y: auto;
  }
  .cmd-results li {
    color: var(--color-text);
    border-radius: var(--radius-2);
  }
  .cmd-results li.active {
    background: color-mix(in oklch, var(--color-accent) 18%, transparent);
  }
  .cmd-row {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    inline-size: 100%;
    padding-inline: 0.75rem;
    padding-block: 0.5rem;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
    text-align: start;
  }
  .cmd-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cmd-type {
    font-size: var(--text-2xs);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-subtle);
  }
  .cmd-empty {
    padding: 1.25rem;
    text-align: center;
    color: var(--color-text-subtle);
    font-size: var(--text-sm);
  }
</style>
