<script lang="ts">
  import Icon from '@iconify/svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Lumen</title>
</svelte:head>

<section class="dashboard">
  <header class="dashboard-header">
    <h1>Recent</h1>
    <a href="/n/new" class="primary">
      <Icon icon="ph:plus" width="14" /> New node
    </a>
  </header>

  {#if data.recent.length === 0}
    <p class="empty">
      No nodes yet. Press <kbd>⌘N</kbd> to create one or
      <a href="/n/new">start here</a>.
    </p>
  {:else}
    <ul class="node-list">
      {#each data.recent as node (node.id)}
        <li>
          <a href={`/n/${node.slug}`}>
            <span class="node-type">{node.type}</span>
            <span class="node-title">{node.title}</span>
            <time datetime={node.updatedAt instanceof Date ? node.updatedAt.toISOString() : ''}>
              {new Date(node.updatedAt).toLocaleDateString()}
            </time>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .dashboard {
    display: grid;
    gap: var(--space-5);
  }
  .dashboard-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  h1 {
    font-size: var(--text-2xl);
    margin: 0;
  }
  .primary {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding-inline: 0.875rem;
    padding-block: 0.4rem;
    border-radius: var(--radius-2);
    background: var(--color-accent);
    color: var(--color-accent-text);
    font-size: var(--text-sm);
    text-decoration: none;
  }
  .empty {
    color: var(--color-text-muted);
  }
  kbd {
    font-family: var(--font-mono);
    font-size: var(--text-2xs);
    padding-inline: 0.4rem;
    padding-block: 0.05rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-1);
    background: var(--color-surface-raised);
  }
  .node-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.5rem;
  }
  .node-list a {
    display: grid;
    grid-template-columns: 5rem 1fr auto;
    gap: 1rem;
    align-items: center;
    padding-inline: 0.875rem;
    padding-block: 0.625rem;
    border-radius: var(--radius-2);
    border: 1px solid var(--color-border);
    color: inherit;
    text-decoration: none;
    background: var(--color-surface);
  }
  .node-list a:hover {
    border-color: var(--color-border-strong);
  }
  .node-type {
    font-size: var(--text-2xs);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-subtle);
  }
  .node-title {
    font-weight: 500;
  }
  time {
    color: var(--color-text-subtle);
    font-size: var(--text-sm);
  }
</style>
