// @ts-check
import { defineConfig, envField } from 'astro/config';
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
  env: {
    schema: {
      // Secreto de servidor: se lee en runtime (no se incrusta en el bundle), así
      // el valor no queda en el build output.
      API_BASE_URL: envField.string({
        context: 'server',
        access: 'secret',
        default: 'http://localhost:3000',
      }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    port: 4321,
    host: true,
  },
});
