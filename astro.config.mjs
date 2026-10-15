import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  site: 'https://getmansfield.com',
  // Old addresses: posts moved from /writing to /analysis, and the /iteratev3 preview became the site.
  redirects: {
    '/writing': '/analysis',
    '/writing/[...slug]': '/analysis/[...slug]',
    '/iteratev3': '/',
    '/iteratev3/projects': '/projects',
    '/iteratev3/personal': '/personal',
    '/iteratev3/analysis': '/analysis',
    '/iteratev3/resources': '/resources',
  },
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
