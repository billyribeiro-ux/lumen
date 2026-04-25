<script lang="ts">
  let {
    name,
    verificationUrl,
  }: {
    name: string;
    verificationUrl: string;
  } = $props();
</script>

<h1>Verify your email</h1>
<p>Hey {name}, please confirm this is you so we can finish setting up your Lumen account.</p>
<p>
  <a class="button" href={verificationUrl}>Verify email</a>
</p>
<p class="muted">
  If the button doesn't work, paste this URL into your browser:<br />{verificationUrl}
</p>
<p class="muted">
  This link expires in 24 hours. If you didn't sign up, you can safely ignore this email.
</p>
