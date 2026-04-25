<script lang="ts">
  import Icon from '@iconify/svelte';
  import { theme } from '$lib/stores/theme.svelte';
  import { shortcuts } from '$lib/stores/shortcuts.svelte';

  interface OrgOption {
    id: string;
    name: string;
    role: string;
  }

  let {
    orgs = [],
    activeOrgId,
    userName,
    role,
  }: {
    orgs: OrgOption[];
    activeOrgId: string | null;
    userName: string;
    role: string | null;
  } = $props();

  const cmdK = $derived(shortcuts.format('Mod+K'));
</script>

<header class="topbar">
  <div class="brand">
    <Icon icon="ph:lightning-fill" width="18" />
    <strong>Lumen</strong>
  </div>

  <button
    type="button"
    class="cmd-trigger"
    aria-label="Open command bar"
    onclick={() =>
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }),
      )}
  >
    <Icon icon="ph:magnifying-glass" width="14" />
    <span>Search or run a command</span>
    <kbd>{cmdK}</kbd>
  </button>

  <nav class="topbar-actions">
    {#if orgs.length > 1}
      <select
        aria-label="Active organization"
        value={activeOrgId ?? ''}
        onchange={(e) => {
          const id = (e.currentTarget as HTMLSelectElement).value;
          window.location.assign(`?org=${id}`);
        }}
      >
        {#each orgs as o (o.id)}
          <option value={o.id}>{o.name}</option>
        {/each}
      </select>
    {/if}

    <button
      type="button"
      aria-label="Cycle theme"
      title={`Theme: ${theme.current}`}
      onclick={() => theme.cycle()}
    >
      <Icon icon="ph:circle-half-tilt" width="16" />
    </button>

    <a href="/account/security" aria-label="Account">
      <span class="user-name">{userName}</span>
      {#if role}
        <span class="user-role">{role}</span>
      {/if}
    </a>
  </nav>
</header>

<style>
  .topbar {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding-inline: var(--space-4);
    block-size: var(--topbar-height);
    border-block-end: 1px solid var(--color-border);
    background: var(--color-surface);
    position: sticky;
    inset-block-start: 0;
    z-index: 10;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-text);
  }
  .cmd-trigger {
    flex: 1;
    max-inline-size: 28rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-inline: 0.75rem;
    padding-block: 0.4rem;
    border-radius: var(--radius-2);
    border: 1px solid var(--color-border);
    background: var(--color-background);
    color: var(--color-text-subtle);
    font-size: var(--text-sm);
    cursor: text;
    text-align: start;
  }
  .cmd-trigger:hover {
    border-color: var(--color-border-strong);
  }
  .cmd-trigger span {
    flex: 1;
  }
  kbd {
    font-family: var(--font-mono);
    font-size: var(--text-2xs);
    padding-inline: 0.4rem;
    padding-block: 0.05rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-1);
    color: var(--color-text-muted);
    background: var(--color-surface-raised);
  }
  .topbar-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-inline-start: auto;
  }
  .topbar-actions select,
  .topbar-actions button,
  .topbar-actions a {
    background: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-text);
    border-radius: var(--radius-2);
    padding-inline: 0.625rem;
    padding-block: 0.35rem;
    font-size: var(--text-sm);
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
  .topbar-actions a:hover,
  .topbar-actions button:hover {
    border-color: var(--color-border-strong);
  }
  .user-role {
    font-size: var(--text-2xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-subtle);
  }
</style>
