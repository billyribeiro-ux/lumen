<script lang="ts">
  let {
    magicUrl,
  }: {
    magicUrl: string;
  } = $props();
</script>

<h1>Sign in to Lumen</h1>
<p>Click the button below to sign in. The link expires in 15 minutes.</p>
<p>
  <a class="button" href={magicUrl}>Sign in</a>
</p>
<p class="muted">Or paste this URL: {magicUrl}</p>
<p class="muted">If you didn't request this, you can safely ignore the email.</p>
