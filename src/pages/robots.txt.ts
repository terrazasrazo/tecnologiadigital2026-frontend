import type { APIRoute } from 'astro';

/** Robots.txt generado en SSR para usar la URL canónica del despliegue. */
export const GET: APIRoute = () => {
  const site = (import.meta.env.PUBLIC_SITE_URL ?? 'http://localhost:4321').replace(/\/+$/, '');

  const body = `User-agent: *
Allow: /
Disallow: /app/
Disallow: /admin/
Disallow: /organizador/
Disallow: /ponente/
Disallow: /auth/
Disallow: /api/
Disallow: /logout

Sitemap: ${site}/sitemap.xml
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
