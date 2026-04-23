// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import cloudflare from '@astrojs/cloudflare';
import remarkDirective from 'remark-directive';
import { remarkCallouts } from './src/lib/remark-callouts.mjs';

// https://astro.build/config
export default defineConfig({
  integrations: [
    svelte(),
    mdx(),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: cloudflare(),

  markdown: {
    remarkPlugins: [remarkDirective, remarkCallouts],
    shikiConfig: {
      theme: 'tokyo-night',
    },
  },
});