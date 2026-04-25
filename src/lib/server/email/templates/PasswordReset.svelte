<script lang="ts">
  let {
    name,
    resetUrl,
  }: {
    name: string;
    resetUrl: string;
  } = $props();
</script>

<h1>Reset your password</h1>
<p>Hi {name}, click the button below to set a new password for your Lumen account.</p>
<p>
  <a class="button" href={resetUrl}>Reset password</a>
</p>
<p class="muted">Or paste this URL: {resetUrl}</p>
<p class="muted">
  If you didn't request a reset, you can safely ignore this email — your password won't change.
</p>
