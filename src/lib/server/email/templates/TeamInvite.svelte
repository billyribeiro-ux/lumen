<script lang="ts">
  let {
    inviterName,
    organizationName,
    role,
    acceptUrl,
  }: {
    inviterName: string;
    organizationName: string;
    role: string;
    acceptUrl: string;
  } = $props();
</script>

<h1>{inviterName} invited you to {organizationName}</h1>
<p>
  You've been invited to join <strong>{organizationName}</strong> on Lumen as
  <strong>{role}</strong>.
</p>
<p>
  <a class="button" href={acceptUrl}>Accept invitation</a>
</p>
<p class="muted">Or paste this URL: {acceptUrl}</p>
<p class="muted">This invitation expires in 7 days.</p>
