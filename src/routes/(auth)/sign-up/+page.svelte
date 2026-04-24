<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
  <title>Create your Lumen account</title>
</svelte:head>

<main>
  <header>
    <h1>Create your account</h1>
    <p>Free 30-day Pro trial — no card required.</p>
  </header>

  <form method="POST" use:enhance>
    <label>
      <span>Name</span>
      <input type="text" name="name" autocomplete="name" required value={form?.name ?? ''} />
    </label>
    <label>
      <span>Email</span>
      <input type="email" name="email" autocomplete="email" required value={form?.email ?? ''} />
    </label>
    <label>
      <span>Password</span>
      <input type="password" name="password" autocomplete="new-password" minlength="12" required />
    </label>
    {#if form?.message}
      <p class="form-error" role="alert">{form.message}</p>
    {/if}
    <button type="submit">Create account</button>
  </form>

  <p>
    Already have an account?
    <a href="/sign-in">Sign in</a>
  </p>
</main>
