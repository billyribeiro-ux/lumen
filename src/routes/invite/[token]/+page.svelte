<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Invitation — Lumen</title>
</svelte:head>

<main>
  <header>
    <h1>Team invitation</h1>
  </header>

  {#if data.state === 'not-found'}
    <p>This invitation does not exist.</p>
  {:else if data.state === 'revoked'}
    <p>This invitation was revoked.</p>
  {:else if data.state === 'expired'}
    <p>This invitation has expired. Ask the inviter to send a new one.</p>
  {:else if data.state === 'accepted'}
    <p>This invitation was already accepted.</p>
  {:else if data.state === 'pending'}
    <p>
      You've been invited to join <strong>{data.invite.orgName}</strong>
      as <strong>{data.invite.role}</strong>.
    </p>
    {#if !data.user}
      <p>
        <a href={`/sign-in?next=/invite/${data.invite.id}`}>Sign in</a> with
        <strong>{data.invite.email}</strong> to accept.
      </p>
      <p class="muted">
        No account yet? <a href={`/sign-up?email=${encodeURIComponent(data.invite.email)}`}
          >Create one</a
        >.
      </p>
    {:else if data.user.email.toLowerCase() !== data.invite.email}
      <p class="form-error">
        This invitation is for <strong>{data.invite.email}</strong>, but you're signed in as
        <strong>{data.user.email}</strong>. Sign out and sign in with the right account.
      </p>
    {:else}
      <form method="POST" use:enhance>
        <button type="submit">Accept invitation</button>
      </form>
    {/if}
  {/if}

  <p class="footer-link"><a href="/">Back home</a></p>
</main>

<style>
  main {
    max-inline-size: 32rem;
    margin-inline: auto;
    padding: 4rem 1.5rem;
    display: grid;
    gap: 1rem;
    font-family: 'Inter', system-ui, sans-serif;
  }
  h1 {
    font-size: clamp(1.75rem, 1rem + 2vw, 2.25rem);
    font-weight: 600;
    letter-spacing: -0.02em;
    margin: 0;
  }
  p {
    line-height: 1.5;
    margin: 0;
  }
  .muted {
    opacity: 0.7;
  }
  button {
    padding: 0.625rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid transparent;
    background: var(--color-accent, oklch(0.72 0.2 260));
    color: oklch(0.99 0 0);
    font: inherit;
    cursor: pointer;
  }
  .form-error {
    color: oklch(0.62 0.18 25);
  }
  .footer-link {
    font-size: 0.875rem;
    opacity: 0.7;
    margin-block-start: 1rem;
  }
</style>
