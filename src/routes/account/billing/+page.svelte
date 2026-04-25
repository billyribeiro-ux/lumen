<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function fmt(amt: number, cur: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cur.toUpperCase(),
    }).format(amt / 100);
  }

  const trialMs = $derived(
    data.entitlement?.trialEndsAt
      ? new Date(data.entitlement.trialEndsAt).getTime() - Date.now()
      : 0,
  );
  const trialDaysLeft = $derived(Math.max(0, Math.ceil(trialMs / (24 * 60 * 60 * 1000))));
</script>

<svelte:head>
  <title>Billing — Lumen</title>
</svelte:head>

<main class="billing">
  <header>
    <h1>Billing</h1>
    <p>Manage your subscription, payment methods, and invoice history.</p>
  </header>

  <section class="card">
    <h2>Plan</h2>
    {#if data.subscription}
      <dl>
        <dt>Tier</dt>
        <dd>{data.subscription.productName}</dd>
        <dt>Status</dt>
        <dd class="status status-{data.subscription.status}">{data.subscription.status}</dd>
        <dt>Price</dt>
        <dd>
          {fmt(data.subscription.unitAmount, data.subscription.currency)} /
          {data.subscription.interval}
        </dd>
        {#if data.subscription.currentPeriodEnd}
          <dt>{data.subscription.cancelAtPeriodEnd ? 'Ends on' : 'Renews on'}</dt>
          <dd>{new Date(data.subscription.currentPeriodEnd).toLocaleDateString()}</dd>
        {/if}
        {#if data.subscription.trialEnd && new Date(data.subscription.trialEnd) > new Date()}
          <dt>Trial ends</dt>
          <dd>{new Date(data.subscription.trialEnd).toLocaleDateString()}</dd>
        {/if}
      </dl>
      <form method="POST" action="/api/portal">
        <button type="submit" class="primary">Manage subscription</button>
      </form>
    {:else if data.entitlement?.tier === 'pro' && trialDaysLeft > 0}
      <p>
        You're on a <strong>30-day Pro trial</strong>. {trialDaysLeft}
        {trialDaysLeft === 1 ? 'day' : 'days'} remaining.
      </p>
      <a class="primary" href="/pricing">Pick a paid plan</a>
    {:else}
      <p>You're on the <strong>Free</strong> tier.</p>
      <a class="primary" href="/pricing">Upgrade</a>
    {/if}
  </section>

  <section class="card">
    <h2>Payment methods</h2>
    {#if data.cards.length === 0}
      <p class="muted">No saved payment methods.</p>
    {:else}
      <ul>
        {#each data.cards as card (card.id)}
          <li>
            <span>{card.brand?.toUpperCase()} •••• {card.last4}</span>
            <small>expires {card.expMonth}/{card.expYear}</small>
            {#if card.isDefault}
              <span class="default">default</span>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
    {#if data.subscription}
      <form method="POST" action="/api/portal">
        <button type="submit">Manage payment methods</button>
      </form>
    {/if}
  </section>

  <section class="card">
    <h2>Invoices</h2>
    {#if data.recentInvoices.length === 0}
      <p class="muted">No invoices yet.</p>
    {:else}
      <ul>
        {#each data.recentInvoices as inv (inv.id)}
          <li>
            <span class="status status-{inv.status}">{inv.status}</span>
            <span>{fmt(inv.totalAmount, inv.currency)}</span>
            <time>{new Date(inv.createdAt).toLocaleDateString()}</time>
            {#if inv.hostedInvoiceUrl}
              <a href={inv.hostedInvoiceUrl} target="_blank" rel="noopener">Receipt</a>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>

<style>
  .billing {
    inline-size: min(48rem, 100%);
    margin-inline: auto;
    padding-block: var(--space-6);
    display: grid;
    gap: var(--space-5);
  }
  h1 {
    font-size: var(--text-2xl);
    margin-block: 0 0.25rem;
  }
  h2 {
    font-size: var(--text-lg);
    margin-block: 0 var(--space-2);
  }
  header p {
    color: var(--color-text-muted);
  }
  .card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-3);
    padding: var(--space-5);
    background: var(--color-surface);
    display: grid;
    gap: var(--space-3);
  }
  dl {
    display: grid;
    grid-template-columns: 8rem 1fr;
    gap: 0.4rem 1rem;
    margin: 0;
  }
  dt {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }
  dd {
    margin: 0;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.4rem;
  }
  li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding-inline: 0.75rem;
    padding-block: 0.5rem;
    border-radius: var(--radius-2);
    background: color-mix(in oklch, currentColor 4%, transparent);
  }
  .status {
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: var(--text-2xs);
    padding-inline: 0.4rem;
    padding-block: 0.05rem;
    border-radius: var(--radius-1);
    background: color-mix(in oklch, currentColor 8%, transparent);
  }
  .status-active,
  .status-paid {
    background: color-mix(in oklch, var(--color-success) 25%, transparent);
  }
  .status-trialing {
    background: color-mix(in oklch, var(--color-accent) 20%, transparent);
  }
  .status-past_due,
  .status-uncollectible {
    background: color-mix(in oklch, var(--color-warning) 25%, transparent);
  }
  .status-canceled,
  .status-void {
    background: color-mix(in oklch, var(--color-danger) 20%, transparent);
  }
  .default {
    margin-inline-start: auto;
    font-size: var(--text-2xs);
    color: var(--color-text-subtle);
  }
  .muted {
    color: var(--color-text-muted);
  }
  button,
  a.primary {
    display: inline-flex;
    padding-inline: var(--space-4);
    padding-block: 0.5rem;
    border-radius: var(--radius-2);
    border: 1px solid var(--color-border);
    background: transparent;
    color: inherit;
    cursor: pointer;
    text-decoration: none;
    font: inherit;
  }
  button.primary,
  a.primary {
    background: var(--color-accent);
    color: var(--color-accent-text);
    border-color: transparent;
  }
  time {
    margin-inline-start: auto;
    color: var(--color-text-subtle);
    font-size: var(--text-sm);
  }
</style>
