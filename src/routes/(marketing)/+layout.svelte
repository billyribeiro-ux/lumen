<script lang="ts">
  let { children } = $props();
</script>

<div class="marketing">
  {@render children()}
</div>

<style>
  .marketing {
    min-block-size: 100dvh;
    color-scheme: dark light;
  }
</style>
