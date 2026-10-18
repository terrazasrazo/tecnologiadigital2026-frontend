// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // SSR en todas las páginas: los datos vienen frescos del API en cada request.
  output: 'server',
  // En Netlify (NETLIFY=true en su build) salen funciones serverless; en local
  // se mantiene el servidor Node para dev, preview y pruebas e2e.
  adapter: process.env.NETLIFY ? netlify() : node({ mode: 'standalone' }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    port: 4321,
    host: true,
  },
});
