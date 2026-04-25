<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types';

  let {
    data,
    form,
  }: {
    data: PageData;
    form: ActionData;
  } = $props();

  const types = [
    'note',
    'task',
    'decision',
    'spec',
    'snippet',
    'project',
    'person',
    'link',
  ] as const;
</script>

<svelte:head>
  <title>New node — Lumen</title>
</svelte:head>

<section class="new-node">
  <h1>New node</h1>
  <form method="POST" use:enhance>
    <input type="hidden" name="organizationId" value={data.activeOrgId ?? ''} />
    <label class="grid-row">
      <span>Type</span>
      <select name="type" required>
        {#each types as t}
          <option value={t}>{t}</option>
        {/each}
      </select>
    </label>
    <label class="grid-row">
      <span>Title</span>
      <input type="text" name="title" required maxlength="280" autocomplete="off" />
    </label>
    <label class="grid-row">
      <span>Body</span>
      <textarea name="body" rows="14" placeholder="Markdown — [[wiki-links]] and #tags supported"
      ></textarea>
    </label>
    <label class="grid-row">
      <span>Tags</span>
      <input type="text" name="tags" placeholder="comma-separated" autocomplete="off" />
    </label>
    {#if form?.message}
      <p class="form-error" role="alert">{form.message}</p>
    {/if}
    <div class="actions">
      <a href="/">Cancel</a>
      <button type="submit">Create</button>
    </div>
  </form>
</section>

<style>
  .new-node {
    display: grid;
    gap: var(--space-5);
    inline-size: min(48rem, 100%);
    margin-inline: auto;
  }
  h1 {
    font-size: var(--text-2xl);
    margin: 0;
  }
  form {
    display: grid;
    gap: var(--space-3);
  }
  .grid-row {
    display: grid;
    grid-template-columns: 8rem 1fr;
    gap: 0.75rem;
    align-items: start;
  }
  .grid-row > span {
    padding-block-start: 0.5rem;
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }
  input,
  textarea,
  select {
    inline-size: 100%;
    padding-inline: 0.75rem;
    padding-block: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2);
    background: var(--color-background);
    color: var(--color-text);
    font: inherit;
  }
  textarea {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    resize: vertical;
    min-block-size: 16rem;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.625rem;
    align-items: center;
  }
  .actions a {
    color: var(--color-text-muted);
    text-decoration: none;
  }
  .actions button {
    padding-inline: 1rem;
    padding-block: 0.5rem;
    border-radius: var(--radius-2);
    border: 1px solid transparent;
    background: var(--color-accent);
    color: var(--color-accent-text);
    font: inherit;
    cursor: pointer;
  }
  .form-error {
    color: var(--color-danger);
    font-size: var(--text-sm);
  }
</style>
