<script lang="ts">
  import GraphView from '$lib/components/graph/GraphView.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Graph — Lumen</title>
</svelte:head>

<GraphView nodes={data.nodes} links={data.links} />
