// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  site: 'https://nikeemolo.github.io',

  fonts: [
  {
      provider: fontProviders.fontsource(),
      name: "David Libre",
      cssVariable: "--main-font"
  },
  {
      provider: fontProviders.fontsource(),
      name: "DM Sans",
      cssVariable: "--secondary-font"
  },
  {
      provider: fontProviders.fontsource(),
      name: "Boldonse",
      cssVariable: "--boldonse"
  },
  {
      provider: fontProviders.fontsource(),
      name: "Archivo",
      cssVariable: "--archivo-font",
      weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
  }],

  integrations: [mdx()],

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },

  redirects: {
    '/projects': '/',
  }
});