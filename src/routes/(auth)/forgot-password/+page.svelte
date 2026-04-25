<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
  <title>Forgot password — Lumen</title>
</svelte:head>

<main>
  <header>
    <h1>Reset your password</h1>
    <p>Enter the email on your account. We'll send a reset link.</p>
  </header>

  {#if form?.sent}
    <p class="form-success" role="status">
      If an account exists for {form.email}, a reset link is on the way.
    </p>
    <p><a href="/sign-in">Back to sign in</a></p>
  {:else}
    <form method="POST" use:enhance>
      <label>
        <span>Email</span>
        <input type="email" name="email" autocomplete="email" required value={form?.email ?? ''} />
      </label>
      {#if form?.message}
        <p class="form-error" role="alert">{form.message}</p>
      {/if}
      <button type="submit">Send reset link</button>
    </form>
    <p><a href="/sign-in">Back to sign in</a></p>
  {/if}
</main>
