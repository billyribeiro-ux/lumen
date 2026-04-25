<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.pub.title} — published with Lumen</title>
  <meta name="description" content={data.pub.title} />
  <meta name="robots" content="index,follow" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content={data.pub.title} />
  <meta property="og:site_name" content="Lumen" />
</svelte:head>

<article class="published">
  <header>
    <h1>{data.pub.title}</h1>
    <p class="meta">
      <time datetime={new Date(data.pub.publishedAt).toISOString()}>
        Published {new Date(data.pub.publishedAt).toLocaleDateString()}
      </time>
      ·
      <a href="https://lumen.so" rel="nofollow">made with Lumen</a>
    </p>
  </header>
  <pre class="markdown">{data.pub.body}</pre>
  {#if data.pub.commentsEnabled}
    <section class="comments">
      <h2>Comments</h2>
      <p class="muted">Comments are open. (Phase 18.x wires the comment thread.)</p>
    </section>
  {/if}
</article>

<style>
  .published {
    inline-size: min(38rem, 100% - 2rem);
    margin-inline: auto;
    padding-block: var(--space-8);
    font-family: var(--font-reading);
  }
  h1 {
    font-family: var(--font-ui);
    font-size: var(--text-3xl);
    margin-block: 0 var(--space-2);
  }
  .meta {
    color: var(--color-text-subtle);
    font-size: var(--text-sm);
    font-family: var(--font-ui);
    margin-block-end: var(--space-5);
  }
  .meta a {
    color: var(--color-text-muted);
  }
  .markdown {
    white-space: pre-wrap;
    line-height: 1.7;
    font-size: var(--text-base);
    background: transparent;
    padding: 0;
    margin: 0;
  }
  .comments {
    margin-block-start: var(--space-8);
    border-block-start: 1px solid var(--color-border);
    padding-block-start: var(--space-4);
  }
  h2 {
    font-family: var(--font-ui);
    font-size: var(--text-lg);
    margin: 0 0 var(--space-2);
  }
  .muted {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }
</style>
