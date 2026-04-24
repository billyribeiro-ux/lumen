<script lang="ts">
  import { enhance } from '$app/forms';
  import { signIn } from '$lib/auth-client';
  import type { ActionData, PageData } from './$types';

  let { form }: { form: ActionData; data: PageData } = $props();

  // Used by progressive-enhancement OAuth + magic-link buttons that
  // bypass the default form action.
  let workingProvider = $state<'google' | 'github' | 'magic-link' | null>(null);
  let magicEmail = $state('');
  let magicState = $state<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function startOAuth(provider: 'google' | 'github') {
    workingProvider = provider;
    await signIn.social({ provider, callbackURL: '/' });
    workingProvider = null;
  }

  async function startMagicLink() {
    if (!magicEmail) return;
    magicState = 'sending';
    workingProvider = 'magic-link';
    const res = await signIn.magicLink({ email: magicEmail, callbackURL: '/' });
    magicState = res.error ? 'error' : 'sent';
    workingProvider = null;
  }
</script>

<svelte:head>
  <title>Sign in — Lumen</title>
</svelte:head>

<main class="auth-shell">
  <header>
    <h1>Sign in</h1>
    <p>Welcome back. Use your password, a passkey, or a magic link.</p>
  </header>

  <form method="POST" use:enhance>
    <label>
      <span>Email</span>
      <input type="email" name="email" autocomplete="email" required value={form?.email ?? ''} />
    </label>
    <label>
      <span>Password</span>
      <input type="password" name="password" autocomplete="current-password" required />
    </label>
    {#if form?.message}
      <p class="form-error" role="alert">{form.message}</p>
    {/if}
    <button type="submit">Sign in</button>
  </form>

  <div class="divider"><span>or</span></div>

  <div class="alt-methods">
    <button type="button" onclick={() => startOAuth('google')} disabled={workingProvider !== null}>
      Continue with Google
    </button>
    <button type="button" onclick={() => startOAuth('github')} disabled={workingProvider !== null}>
      Continue with GitHub
    </button>

    <form
      class="magic-link"
      onsubmit={(e) => {
        e.preventDefault();
        startMagicLink();
      }}
    >
      <label>
        <span>Magic link</span>
        <input
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          bind:value={magicEmail}
          required
        />
      </label>
      <button type="submit" disabled={workingProvider !== null}>Email me a link</button>
      {#if magicState === 'sent'}
        <p class="form-success" role="status">Magic link sent — check your inbox.</p>
      {:else if magicState === 'error'}
        <p class="form-error" role="alert">Could not send magic link. Try again.</p>
      {/if}
    </form>
  </div>

  <footer>
    <a href="/forgot-password">Forgot password?</a>
    <a href="/sign-up">Create an account</a>
  </footer>
</main>

<style>
  .auth-shell {
    display: grid;
    place-content: center;
    gap: 1.5rem;
    min-block-size: 100dvh;
    padding-inline: 2rem;
    padding-block: 2rem;
    inline-size: min(28rem, 100%);
    margin-inline: auto;
    font-family: 'Inter', system-ui, sans-serif;
  }
  header {
    text-align: center;
  }
  h1 {
    font-size: clamp(1.75rem, 1rem + 2.5vw, 2.5rem);
    font-weight: 600;
    letter-spacing: -0.02em;
    margin-block: 0;
  }
  p {
    margin-block: 0.5rem 0;
    opacity: 0.7;
    line-height: 1.5;
  }
  form {
    display: grid;
    gap: 0.75rem;
  }
  label {
    display: grid;
    gap: 0.25rem;
  }
  span {
    font-size: 0.875rem;
    opacity: 0.7;
  }
  input {
    padding: 0.625rem 0.75rem;
    border: 1px solid color-mix(in oklch, currentColor 20%, transparent);
    border-radius: 0.5rem;
    background: transparent;
    color: inherit;
    font-family: inherit;
    font-size: 1rem;
  }
  input:focus-visible {
    outline: 2px solid var(--color-accent, oklch(0.72 0.2 260));
    outline-offset: 2px;
  }
  button {
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
  button[type='submit'] {
    background: var(--color-accent, oklch(0.72 0.2 260));
    color: oklch(0.99 0 0);
    border-color: transparent;
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .divider {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 0.75rem;
    align-items: center;
    font-size: 0.75rem;
    opacity: 0.5;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .divider::before,
  .divider::after {
    content: '';
    block-size: 1px;
    background: color-mix(in oklch, currentColor 15%, transparent);
  }
  .alt-methods {
    display: grid;
    gap: 0.75rem;
  }
  .magic-link {
    margin-block-start: 0.25rem;
    padding-block-start: 0.75rem;
    border-block-start: 1px solid color-mix(in oklch, currentColor 12%, transparent);
  }
  .form-error {
    color: oklch(0.62 0.18 25);
    font-size: 0.875rem;
    margin: 0;
  }
  .form-success {
    color: oklch(0.6 0.16 145);
    font-size: 0.875rem;
    margin: 0;
  }
  footer {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
    opacity: 0.7;
  }
  footer a {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }
</style>
