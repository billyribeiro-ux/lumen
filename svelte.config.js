import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
    runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true),
  },
  kit: {
    adapter: adapter({
      // Default region for the SvelteKit handler. Tune per-route via
      // `export const config = { regions: [...] }` in load/action files
      // when latency-sensitive routes need geographic colocation.
      runtime: 'nodejs22.x',
      regions: ['iad1'],
      // Fluid Compute is enabled at the project level in Vercel; the
      // adapter does not need explicit opt-in.
      images: {
        sizes: [640, 828, 1200, 1920, 3840],
        formats: ['image/avif', 'image/webp'],
      },
    }),
    csrf: {
      // `trustedOrigins` replaces the deprecated `checkOrigin` option.
      // Empty list = default origin check is active (request Origin must
      // match the host). Add staging / preview origins here when those
      // domains are configured.
      trustedOrigins: [],
    },
    serviceWorker: {
      register: false,
    },
  },
};

export default config;
