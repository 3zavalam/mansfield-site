import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const PORTFOLIO_ONLY = true;
export default defineConfig({
  site: 'https://getmansfield.com',
  // Old addresses: posts moved from /writing to /analysis, and the /iteratev3 preview became the site.
  // Portfolio mode (Oct 2026): the personal sections are hidden, so their old addresses go home.
  // Set PORTFOLIO_ONLY to false (here and in Base.astro) and rename the _ pages to bring them back.
  redirects: PORTFOLIO_ONLY ? {
    ...Object.fromEntries(['/writing', '/iteratev3', '/about', '/now', '/work-with-me', '/personal', '/analysis', '/projects', '/resources'].map((p) => [p, '/'])),
    '/pronos': '/probis',
  } : {
    '/writing': '/analysis',
    '/writing/[...slug]': '/analysis/[...slug]',
    '/iteratev3': '/',
    '/iteratev3/projects': '/projects',
    '/iteratev3/personal': '/personal',
    '/iteratev3/analysis': '/analysis',
    '/iteratev3/resources': '/resources',
  },
  // The demo sites are for fictional businesses: keep them out of the sitemap (they're noindex too).
  integrations: [sitemap({ filter: (page) => !/\/(casa-olivo|norte-dental|ruta-cafe|estudio-arca|atlas-fc|mar-azul|forma-gym|raiz|probis|draft\/.*)\/?$/.test(page) })],
  vite: { plugins: [tailwindcss()] },
});
