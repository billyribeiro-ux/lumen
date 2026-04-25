<script lang="ts">
  import Icon from '@iconify/svelte';

  let {
    feature,
    tier = 'pro',
    description,
  }: {
    feature: string;
    tier?: 'pro' | 'studio';
    description?: string;
  } = $props();
</script>

<div class="upgrade-prompt" role="status">
  <Icon icon="ph:sparkle-fill" width="22" />
  <div>
    <strong>{feature} is a {tier === 'studio' ? 'Studio' : 'Pro'} feature.</strong>
    {#if description}
      <p>{description}</p>
    {/if}
  </div>
  <a href="/pricing">Upgrade</a>
</div>

<style>
  .upgrade-prompt {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4);
    border: 1px solid color-mix(in oklch, var(--color-accent) 50%, transparent);
    border-radius: var(--radius-3);
    background: color-mix(in oklch, var(--color-accent) 10%, var(--color-surface));
    color: var(--color-text);
  }
  strong {
    font-weight: 600;
  }
  p {
    margin-block: 0.25rem 0;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }
  a {
    margin-inline-start: auto;
    padding-inline: 0.875rem;
    padding-block: 0.4rem;
    border-radius: var(--radius-2);
    background: var(--color-accent);
    color: var(--color-accent-text);
    text-decoration: none;
    font-size: var(--text-sm);
  }
</style>
