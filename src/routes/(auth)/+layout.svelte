<script lang="ts">
  let { children } = $props();
</script>

<div class="auth-frame">
  {@render children()}
</div>

<style>
  .auth-frame {
    display: grid;
    place-content: center;
    min-block-size: 100dvh;
    padding-inline: 2rem;
    padding-block: 2rem;
    font-family: 'Inter', system-ui, sans-serif;
    color-scheme: dark light;
  }
  :global(.auth-frame main) {
    display: grid;
    gap: 1.5rem;
    inline-size: min(28rem, 100%);
  }
  :global(.auth-frame h1) {
    font-size: clamp(1.75rem, 1rem + 2.5vw, 2.5rem);
    font-weight: 600;
    letter-spacing: -0.02em;
    margin-block: 0;
  }
  :global(.auth-frame p) {
    margin-block: 0.5rem 0;
    opacity: 0.7;
    line-height: 1.5;
  }
  :global(.auth-frame label) {
    display: grid;
    gap: 0.25rem;
  }
  :global(.auth-frame label > span) {
    font-size: 0.875rem;
    opacity: 0.7;
  }
  :global(.auth-frame input) {
    padding: 0.625rem 0.75rem;
    border: 1px solid color-mix(in oklch, currentColor 20%, transparent);
    border-radius: 0.5rem;
    background: transparent;
    color: inherit;
    font-family: inherit;
    font-size: 1rem;
  }
  :global(.auth-frame input:focus-visible) {
    outline: 2px solid var(--color-accent, oklch(0.72 0.2 260));
    outline-offset: 2px;
  }
  :global(.auth-frame button) {
    padding: 0.625rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid color-mix(in oklch, currentColor 20%, transparent);
    background: transparent;
    color: inherit;
    font-family: inherit;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
  }
  :global(.auth-frame button[type='submit']) {
    background: var(--color-accent, oklch(0.72 0.2 260));
    color: oklch(0.99 0 0);
    border-color: transparent;
  }
  :global(.auth-frame button:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }
  :global(.auth-frame .form-error) {
    color: oklch(0.62 0.18 25);
    font-size: 0.875rem;
    margin: 0;
  }
  :global(.auth-frame .form-success) {
    color: oklch(0.6 0.16 145);
    font-size: 0.875rem;
    margin: 0;
  }
</style>
