<script lang="ts">
  import { enhance } from '$app/forms';
  import { authClient, signOut } from '$lib/auth-client';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let registeringPasskey = $state(false);
  let passkeyError = $state<string | null>(null);

  async function registerPasskey() {
    registeringPasskey = true;
    passkeyError = null;
    const res = await authClient.passkey.addPasskey({ name: 'My device' });
    if (res?.error) passkeyError = res.error.message ?? 'Failed to register passkey.';
    registeringPasskey = false;
    if (!passkeyError) location.reload();
  }
</script>

<svelte:head>
  <title>Security — Lumen</title>
</svelte:head>

<main class="security-page">
  <header>
    <h1>Security</h1>
    <p>Manage your sessions, passkeys, and two-factor authentication.</p>
  </header>

  <section>
    <h2>Account</h2>
    <dl>
      <dt>Email</dt>
      <dd>{data.user.email}</dd>
      <dt>Name</dt>
      <dd>{data.user.name}</dd>
      <dt>Email verified</dt>
      <dd>{data.user.emailVerified ? 'Yes' : 'No'}</dd>
      <dt>Two-factor authentication</dt>
      <dd>{data.twoFactorEnabled ? 'Enabled' : 'Disabled'}</dd>
    </dl>
  </section>

  <section>
    <h2>Passkeys</h2>
    {#if data.passkeys.length === 0}
      <p>No passkeys registered yet. Add one for one-tap sign-in across devices.</p>
    {:else}
      <ul>
        {#each data.passkeys as p}
          {@const passkey = p as { id: string; name?: string; createdAt?: string | Date }}
          <li>
            <span>{passkey.name ?? 'Unnamed passkey'}</span>
            <small
              >added {passkey.createdAt
                ? new Date(passkey.createdAt).toLocaleDateString()
                : ''}</small
            >
          </li>
        {/each}
      </ul>
    {/if}
    <button type="button" onclick={registerPasskey} disabled={registeringPasskey}>
      {registeringPasskey ? 'Registering…' : 'Register a passkey'}
    </button>
    {#if passkeyError}
      <p class="error" role="alert">{passkeyError}</p>
    {/if}
  </section>

  <section>
    <h2>Active sessions</h2>
    {#if data.sessions.length === 0}
      <p>No other sessions.</p>
    {:else}
      <ul>
        {#each data.sessions as s}
          {@const session = s as {
            id: string;
            userAgent?: string;
            ipAddress?: string;
            createdAt?: string | Date;
          }}
          <li>
            <span>{session.userAgent ?? 'Unknown device'}</span>
            <small>{session.ipAddress ?? 'unknown ip'}</small>
          </li>
        {/each}
      </ul>
    {/if}
    <form method="POST" action="?/signOutEverywhere" use:enhance>
      <button type="submit">Sign out of all other sessions</button>
    </form>
  </section>

  <section>
    <h2>This session</h2>
    <button
      type="button"
      onclick={async () => {
        await signOut();
        location.assign('/sign-in');
      }}
    >
      Sign out
    </button>
  </section>
</main>

<style>
  .security-page {
    inline-size: min(48rem, 100%);
    margin-inline: auto;
    padding: 2rem 1.5rem;
    display: grid;
    gap: 2rem;
    font-family: 'Inter', system-ui, sans-serif;
  }
  h1 {
    font-size: clamp(1.75rem, 1rem + 2vw, 2.25rem);
    font-weight: 600;
    letter-spacing: -0.02em;
    margin-block-end: 0.25rem;
  }
  h2 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-block: 0 0.75rem;
  }
  section {
    border-block-start: 1px solid color-mix(in oklch, currentColor 10%, transparent);
    padding-block-start: 1.25rem;
  }
  dl {
    display: grid;
    grid-template-columns: minmax(8rem, max-content) 1fr;
    gap: 0.5rem 1rem;
    margin: 0;
  }
  dt {
    font-size: 0.875rem;
    opacity: 0.7;
  }
  dd {
    margin: 0;
  }
  ul {
    margin: 0 0 1rem;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 0.5rem;
  }
  li {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    background: color-mix(in oklch, currentColor 4%, transparent);
  }
  small {
    opacity: 0.6;
  }
  button {
    padding: 0.5rem 0.875rem;
    border-radius: 0.5rem;
    border: 1px solid color-mix(in oklch, currentColor 20%, transparent);
    background: transparent;
    color: inherit;
    cursor: pointer;
    font-size: 0.95rem;
    font-family: inherit;
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .error {
    color: oklch(0.62 0.18 25);
    font-size: 0.875rem;
    margin: 0.5rem 0 0;
  }
</style>
