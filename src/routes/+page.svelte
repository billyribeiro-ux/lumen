<script lang="ts">
  // Phase 1 placeholder. Real landing surface lands in Phase 6+ alongside the
  // command bar (⌘K), focus mode (⌘.), and the graph view (⌘G). See LUMEN_VISION.md.
</script>

<main>
  <h1>Lumen</h1>
  <p>Your second brain, lit.</p>
  <p class="muted">v0.2.0 — Phase 1: Database Schema</p>
</main>

<style>
  main {
    display: grid;
    place-content: center;
    min-block-size: 100dvh;
    padding-inline: 2rem;
    text-align: center;
    font-family: system-ui, sans-serif;
  }
  h1 {
    font-size: clamp(2.5rem, 1.5rem + 4vw, 5rem);
    font-weight: 600;
    letter-spacing: -0.02em;
    margin-block-end: 0.5rem;
  }
  p {
    font-size: clamp(1rem, 0.9rem + 0.5vw, 1.25rem);
    margin-block: 0.25rem;
  }
  .muted {
    opacity: 0.5;
    font-size: 0.875rem;
    margin-block-start: 1.5rem;
  }
</style>
