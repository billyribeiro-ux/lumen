<script lang="ts">
  let {
    name,
    appUrl,
  }: {
    name: string;
    appUrl: string;
  } = $props();
</script>

<h1>Welcome, {name} 👋</h1>
<p>Your Lumen account is ready. You're on a 30-day Pro trial — no card required.</p>
<p>
  Tip: hit <strong>⌘K</strong> from anywhere in the app to search nodes, run commands, or jump to any
  page.
</p>
<p>
  <a class="button" href={appUrl}>Open Lumen</a>
</p>
<p class="muted">Stuck? Reply to this email — it goes straight to a real human on the team.</p>
