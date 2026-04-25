<script module lang="ts">
  function prettyKey(k: string): string {
    return k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
  }
  function prettyValue(v: unknown): string {
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (typeof v === 'number') return v < 0 ? 'Unlimited' : String(v);
    return String(v);
  }
</script>

<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Interval = 'month' | 'year';
  let interval = $state<Interval>('month');

  function fmt(unitAmount: number, currency: string) {
    const intl = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    });
    return intl.format(unitAmount / 100);
  }

  function priceFor(product: PageData['products'][number]): {
    amount: string;
    raw: number;
    interval: Interval;
    lookupKey: string | null;
  } | null {
    const match = product.prices.find((p) => p.interval === interval);
    if (!match) return null;
    return {
      amount: fmt(match.unitAmount, match.currency),
      raw: match.unitAmount,
      interval: match.interval as Interval,
      lookupKey: match.lookupKey,
    };
  }

  function annualSavings(product: PageData['products'][number]): string | null {
    const monthly = product.prices.find((p) => p.interval === 'month');
    const annual = product.prices.find((p) => p.interval === 'year');
    if (!monthly || !annual) return null;
    const yearOfMonthly = monthly.unitAmount * 12;
    const saved = yearOfMonthly - annual.unitAmount;
    if (saved <= 0) return null;
    const pct = Math.round((saved / yearOfMonthly) * 100);
    return `Save ${pct}% with annual`;
  }
</script>

<svelte:head>
  <title>Pricing — Lumen</title>
  <meta
    name="description"
    content="Lumen pricing — Free, Pro, and Studio tiers. 30-day Pro trial, no card."
  />
</svelte:head>

<header class="hero">
  <h1>Simple, fair pricing.</h1>
  <p>One free plan. Two paid plans. Thirty-day Pro trial. No card required to start.</p>
  <div class="toggle" role="tablist" aria-label="Billing interval">
    <button
      type="button"
      role="tab"
      aria-selected={interval === 'month'}
      class:active={interval === 'month'}
      onclick={() => (interval = 'month')}
    >
      Monthly
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={interval === 'year'}
      class:active={interval === 'year'}
      onclick={() => (interval = 'year')}
    >
      Annual
    </button>
  </div>
</header>

<section class="grid">
  {#each data.products as product (product.id)}
    {@const price = priceFor(product)}
    {@const savings = annualSavings(product)}
    <article class="plan plan-{product.tier}">
      <header>
        <h2>{product.name}</h2>
        <p>{product.description}</p>
      </header>
      <div class="price">
        {#if price}
          <strong>{price.amount}</strong>
          <span>/{price.interval === 'year' ? 'year' : 'month'}</span>
        {:else}
          <strong>$0</strong>
          <span>forever</span>
        {/if}
        {#if savings && interval === 'year'}
          <p class="savings">{savings}</p>
        {/if}
      </div>
      {#if product.tier === 'free'}
        <a href="/sign-up" class="cta">Get started</a>
      {:else if price?.lookupKey}
        <form method="POST" action="/api/checkout">
          <input type="hidden" name="lookupKey" value={price.lookupKey} />
          <button type="submit" class="cta primary">
            {product.tier === 'pro' ? 'Start your 30-day Pro trial' : `Choose ${product.name}`}
          </button>
        </form>
      {:else}
        <button class="cta" disabled>Coming soon</button>
      {/if}
      <ul class="features">
        {#each Object.entries(product.featureManifest as Record<string, unknown>) as [key, value] (key)}
          <li>
            <strong>{prettyKey(key)}:</strong>
            {prettyValue(value)}
          </li>
        {/each}
      </ul>
    </article>
  {/each}
</section>

<style>
  .hero {
    text-align: center;
    padding-block: var(--space-12) var(--space-8);
    padding-inline: var(--space-4);
  }
  .hero h1 {
    font-size: var(--text-4xl);
  }
  .hero p {
    margin-block: var(--space-3) var(--space-5);
    color: var(--color-text-muted);
    font-size: var(--text-lg);
  }
  .toggle {
    display: inline-flex;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    padding: 0.25rem;
    background: var(--color-surface);
  }
  .toggle button {
    padding: 0.4rem 1rem;
    border: 0;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--color-text-muted);
    font: inherit;
    cursor: pointer;
  }
  .toggle button.active {
    background: var(--color-accent);
    color: var(--color-accent-text);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
    gap: var(--space-5);
    inline-size: var(--content-width);
    margin-inline: auto;
    padding-block: var(--space-8) var(--space-12);
  }
  .plan {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-3);
    padding: var(--space-6);
    background: var(--color-surface);
    display: grid;
    gap: var(--space-3);
  }
  .plan h2 {
    font-size: var(--text-xl);
  }
  .plan p {
    color: var(--color-text-muted);
  }
  .plan-pro {
    border-color: var(--color-accent);
  }
  .price strong {
    font-size: var(--text-3xl);
    font-weight: 700;
  }
  .price span {
    color: var(--color-text-subtle);
    margin-inline-start: 0.25rem;
  }
  .savings {
    font-size: var(--text-sm);
    color: var(--color-success);
    margin-block-start: 0.25rem;
  }
  .cta {
    display: inline-flex;
    justify-content: center;
    padding-inline: var(--space-4);
    padding-block: 0.625rem;
    border-radius: var(--radius-2);
    border: 1px solid var(--color-border);
    background: transparent;
    color: inherit;
    cursor: pointer;
    text-decoration: none;
    font: inherit;
    text-align: center;
  }
  .cta.primary {
    background: var(--color-accent);
    color: var(--color-accent-text);
    border-color: transparent;
  }
  .features {
    list-style: none;
    padding: 0;
    margin: var(--space-3) 0 0;
    display: grid;
    gap: 0.4rem;
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }
  form {
    margin: 0;
  }
</style>
