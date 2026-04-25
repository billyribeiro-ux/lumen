<script lang="ts">
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    createLayout,
    type GraphLinkInput,
    type GraphLinkPosition,
    type GraphNodeInput,
    type GraphNodePosition,
  } from './layout';

  let {
    nodes,
    links,
  }: {
    nodes: GraphNodeInput[];
    links: GraphLinkInput[];
  } = $props();

  let canvas = $state<HTMLCanvasElement | null>(null);
  let dpr = $state(1);
  let hovered = $state<GraphNodePosition | null>(null);
  let typeFilter = $state<string>('all');
  let raf = 0;
  let layout: ReturnType<typeof createLayout> | null = null;

  const filteredNodes = $derived(
    typeFilter === 'all' ? nodes : nodes.filter((n) => n.type === typeFilter),
  );
  const filteredIds = $derived(new Set(filteredNodes.map((n) => n.id)));
  const filteredLinks = $derived(
    links.filter((l) => filteredIds.has(l.source) && filteredIds.has(l.target)),
  );

  $effect(() => {
    if (!canvas) return;
    cancelAnimationFrame(raf);
    layout?.stop();

    const rect = canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    layout = createLayout(filteredNodes, filteredLinks, rect.width, rect.height);
    tick();
  });

  function tick() {
    if (!canvas || !layout) return;
    layout.tick();
    draw();
    raf = requestAnimationFrame(tick);
  }

  function draw() {
    if (!canvas || !layout) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = computedColor('--color-background');
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    // Edges first.
    ctx.lineWidth = 1.2;
    for (const link of layout.links) {
      const src = link.source as GraphNodePosition;
      const dst = link.target as GraphNodePosition;
      if (src.x === undefined || dst.x === undefined) continue;
      ctx.strokeStyle = `hsla(${link.hue * 360}, 60%, 65%, 0.35)`;
      ctx.beginPath();
      ctx.moveTo(src.x, src.y!);
      ctx.lineTo(dst.x, dst.y!);
      ctx.stroke();
    }

    // Nodes — soft glow disk.
    for (const node of layout.positions) {
      if (node.x === undefined || node.y === undefined) continue;
      const r = 10;
      const grd = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 2.4);
      const hueDeg = node.hue * 360;
      grd.addColorStop(0, `hsla(${hueDeg}, 75%, 65%, 0.95)`);
      grd.addColorStop(0.55, `hsla(${hueDeg}, 75%, 60%, 0.5)`);
      grd.addColorStop(1, `hsla(${hueDeg}, 75%, 60%, 0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 2.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `hsla(${hueDeg}, 80%, 75%, 1)`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hover label.
    if (hovered && hovered.x !== undefined && hovered.y !== undefined) {
      ctx.fillStyle = computedColor('--color-text');
      ctx.font = '13px Inter, system-ui, sans-serif';
      ctx.fillText(hovered.title, hovered.x + 14, hovered.y - 8);
    }
    ctx.restore();
  }

  function computedColor(token: string): string {
    if (typeof getComputedStyle !== 'function') return '#000';
    return getComputedStyle(document.documentElement).getPropertyValue(token).trim() || '#000';
  }

  function onMouseMove(e: MouseEvent) {
    if (!canvas || !layout) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let nearest: GraphNodePosition | null = null;
    let nearestDist = 18;
    for (const node of layout.positions) {
      if (node.x === undefined || node.y === undefined) continue;
      const d = Math.hypot(node.x - mx, node.y - my);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = node;
      }
    }
    hovered = nearest;
    canvas.style.cursor = nearest ? 'pointer' : 'default';
  }

  function onClick() {
    if (hovered) goto(`/n/${hovered.slug}`);
  }

  onDestroy(() => {
    cancelAnimationFrame(raf);
    layout?.stop();
  });

  // Available types for the filter chips.
  const TYPE_LIST = $derived(['all', ...Array.from(new Set(nodes.map((n) => n.type))).sort()]);
</script>

<div class="graph-shell">
  <header class="graph-toolbar">
    <strong>Graph</strong>
    <div class="filters">
      {#each TYPE_LIST as t (t)}
        <button type="button" class:active={typeFilter === t} onclick={() => (typeFilter = t)}>
          {t}
        </button>
      {/each}
    </div>
    <span class="count">{filteredNodes.length} nodes · {filteredLinks.length} links</span>
  </header>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <canvas
    bind:this={canvas}
    onmousemove={onMouseMove}
    onclick={onClick}
    aria-label="Lumen graph view"
  ></canvas>

  <footer class="graph-info">
    The graph is rendered to 2D canvas in v1.3.0. WebGPU shaders for the pulsing-glow effect are
    authored under
    <code>src/lib/components/graph/shaders/*.wgsl</code> and ship in a follow-up 1.3.x once the @motion-core/motion-gpu
    pipeline API stabilizes.
  </footer>
</div>

<style>
  .graph-shell {
    display: grid;
    grid-template-rows: auto 1fr auto;
    block-size: calc(100dvh - var(--topbar-height));
    inline-size: 100%;
  }
  .graph-toolbar {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding-block: var(--space-3);
    padding-inline: var(--space-4);
    border-block-end: 1px solid var(--color-border);
  }
  .filters {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  .filters button {
    padding: 0.25rem 0.625rem;
    border-radius: var(--radius-pill);
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text-muted);
    font: inherit;
    font-size: var(--text-xs);
    cursor: pointer;
  }
  .filters button.active {
    background: var(--color-accent);
    color: var(--color-accent-text);
    border-color: transparent;
  }
  .count {
    margin-inline-start: auto;
    color: var(--color-text-subtle);
    font-size: var(--text-sm);
  }
  canvas {
    inline-size: 100%;
    block-size: 100%;
    background: var(--color-background);
  }
  .graph-info {
    padding: var(--space-2) var(--space-4);
    color: var(--color-text-subtle);
    font-size: var(--text-xs);
    border-block-start: 1px solid var(--color-border);
  }
  code {
    font-family: var(--font-mono);
  }
</style>
