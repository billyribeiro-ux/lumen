<script lang="ts">
  import { page } from '$app/state';
</script>

<svelte:head>
  <title>Verify your email — Lumen</title>
</svelte:head>

<main>
  <header>
    <h1>Check your inbox</h1>
    <p>We've sent a verification link to your email. Click it to finish setting up your account.</p>
  </header>

  {#if page.url.searchParams.get('sent') === '1'}
    <p class="form-success" role="status">
      Verification email sent — it usually arrives within a minute.
    </p>
  {/if}

  <p>
    Didn't get it?
    <a href="/sign-in">Try signing in</a>
    — Lumen will resend automatically.
  </p>
</main>
