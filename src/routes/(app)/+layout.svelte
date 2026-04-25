<script lang="ts">
  import CommandBar from '$lib/components/command-bar/CommandBar.svelte';
  import Topbar from '$lib/components/layout/Topbar.svelte';
  import { theme } from '$lib/stores/theme.svelte';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

  $effect(() => {
    theme.init(data.initialTheme);
  });
</script>

<Topbar
  orgs={data.memberOrgs}
  activeOrgId={data.activeOrgId}
  userName={data.user.name}
  role={data.role}
/>

<CommandBar />

<main class="app-main">
  {@render children()}
</main>

<style>
  .app-main {
    inline-size: var(--content-width);
    margin-inline: auto;
    padding-block: var(--space-6);
  }
</style>
