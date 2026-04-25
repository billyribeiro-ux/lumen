<script lang="ts">
  import { enhance } from '$app/forms';
  import Icon from '@iconify/svelte';
  import type { ActionData, PageData } from './$types';

  let {
    data,
    form,
  }: {
    data: PageData;
    form: ActionData;
  } = $props();

  let editing = $state(false);
  let savedAt = $state<Date | null>(null);
  let titleDraft = $state('');
  let bodyDraft = $state('');

  function startEdit() {
    titleDraft = data.node.title;
    bodyDraft = data.content?.body ?? '';
    editing = true;
  }
</script>

<svelte:head>
  <title>{data.node.title} — Lumen</title>
</svelte:head>

<article class="node-view">
  <header class="node-meta">
    <span class="node-type">{data.node.type}</span>
    <span class="node-status status-{data.node.status}">{data.node.status}</span>
    <time datetime={data.node.updatedAt instanceof Date ? data.node.updatedAt.toISOString() : ''}>
      Updated {new Date(data.node.updatedAt).toLocaleString()}
    </time>
    <div class="actions">
      {#if !editing}
        <button type="button" onclick={startEdit}>
          <Icon icon="ph:pencil" width="14" /> Edit
        </button>
        <form method="POST" action="?/delete" use:enhance>
          <input type="hidden" name="id" value={data.node.id} />
          <button type="submit" class="danger">
            <Icon icon="ph:trash" width="14" /> Delete
          </button>
        </form>
      {/if}
    </div>
  </header>

  {#if !editing}
    <h1>{data.node.title}</h1>
    <pre class="markdown">{data.content?.body ?? ''}</pre>
  {:else}
    <form
      method="POST"
      action="?/save"
      use:enhance={() => {
        return async ({ update }) => {
          await update();
          editing = false;
          savedAt = new Date();
        };
      }}
    >
      <input type="hidden" name="id" value={data.node.id} />
      <input class="title-input" type="text" name="title" bind:value={titleDraft} maxlength="280" />
      <textarea name="body" rows="20" bind:value={bodyDraft}></textarea>
      <input type="text" name="versionNote" placeholder="Version note (optional)" maxlength="280" />
      {#if form?.message}
        <p class="form-error" role="alert">{form.message}</p>
      {/if}
      <div class="form-actions">
        <button type="button" onclick={() => (editing = false)}>Cancel</button>
        <button type="submit" class="primary">Save</button>
      </div>
    </form>
  {/if}

  {#if savedAt}
    <p class="saved" role="status">Saved at {savedAt.toLocaleTimeString()}.</p>
  {/if}

  {#if data.backlinks.length > 0}
    <section class="backlinks">
      <h2>Backlinks</h2>
      <ul>
        {#each data.backlinks as bl (bl.sourceNodeId)}
          <li>
            <a href={`/n/${bl.sourceSlug}`}>{bl.sourceTitle}</a>
            <span class="rel">{bl.relationType}</span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</article>

<style>
  .node-view {
    inline-size: var(--reading-width);
    margin-inline: auto;
    display: grid;
    gap: var(--space-4);
    font-family: var(--font-reading);
  }
  .node-meta {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    flex-wrap: wrap;
  }
  .node-type {
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-subtle);
  }
  .node-status {
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding-inline: 0.4rem;
    padding-block: 0.05rem;
    border-radius: var(--radius-1);
    background: color-mix(in oklch, var(--color-text) 8%, transparent);
    font-size: var(--text-2xs);
  }
  time {
    flex: 1;
  }
  .actions {
    display: flex;
    gap: 0.5rem;
  }
  button {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding-inline: 0.625rem;
    padding-block: 0.3rem;
    border-radius: var(--radius-2);
    border: 1px solid var(--color-border);
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
  button.primary {
    background: var(--color-accent);
    color: var(--color-accent-text);
    border-color: transparent;
  }
  button.danger {
    color: var(--color-danger);
  }
  h1 {
    font-family: var(--font-ui);
    font-size: var(--text-3xl);
    margin-block: var(--space-2) var(--space-3);
  }
  .markdown {
    white-space: pre-wrap;
    font-family: var(--font-reading);
    font-size: var(--text-base);
    line-height: 1.7;
    background: transparent;
    padding: 0;
    margin: 0;
  }
  form {
    display: grid;
    gap: 0.75rem;
  }
  .title-input {
    font: inherit;
    font-family: var(--font-ui);
    font-size: var(--text-2xl);
    font-weight: 600;
    border: 0;
    border-block-end: 1px solid var(--color-border);
    background: transparent;
    color: inherit;
    padding-block: 0.5rem;
  }
  textarea {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: 1.6;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2);
    background: var(--color-background);
    color: inherit;
    padding: 0.75rem;
    resize: vertical;
  }
  textarea:focus-visible {
    border-color: var(--color-accent);
  }
  input[type='text'][name='versionNote'] {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2);
    background: var(--color-background);
    color: inherit;
    padding: 0.5rem 0.75rem;
  }
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.625rem;
  }
  .form-error {
    color: var(--color-danger);
    font-size: var(--text-sm);
  }
  .saved {
    color: var(--color-success);
    font-size: var(--text-sm);
  }
  .backlinks {
    border-block-start: 1px solid var(--color-border);
    padding-block-start: var(--space-4);
  }
  h2 {
    font-family: var(--font-ui);
    font-size: var(--text-lg);
    margin-block: 0 0.5rem;
  }
  .backlinks ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.4rem;
  }
  .backlinks li {
    display: flex;
    gap: 0.625rem;
    align-items: center;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
  }
  .backlinks a {
    color: var(--color-accent);
  }
  .backlinks .rel {
    color: var(--color-text-subtle);
    font-size: var(--text-2xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
</style>
