<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types';

  let {
    form,
    data,
  }: {
    form: ActionData;
    data: PageData;
  } = $props();
</script>

<svelte:head>
  <title>Reset password — Lumen</title>
</svelte:head>

<main>
  <header>
    <h1>Choose a new password</h1>
    <p>Use at least 12 characters. A passphrase works great.</p>
  </header>

  {#if !data.token}
    <p class="form-error" role="alert">
      Reset link is missing or invalid. Request a new one from the
      <a href="/forgot-password">forgot password</a> page.
    </p>
  {:else}
    <form method="POST" use:enhance>
      <input type="hidden" name="token" value={data.token} />
      <label>
        <span>New password</span>
        <input
          type="password"
          name="password"
          autocomplete="new-password"
          minlength="12"
          required
        />
      </label>
      {#if form?.message}
        <p class="form-error" role="alert">{form.message}</p>
      {/if}
      <button type="submit">Reset password</button>
    </form>
  {/if}
</main>
