import type { APIRoute } from 'astro';
import { list as listTalks } from '../lib/api/talks';
import { list as listSpeakers } from '../lib/api/speakers';

/** Rutas públicas fijas. Las dinámicas (ponencias/ponentes) se añaden desde el API. */
const STATIC_ROUTES = ['/', '/agenda', '/ponentes', '/verificar'];

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Sitemap SSR: rutas estáticas + detalle de ponencias y ponentes. */
export const GET: APIRoute = async () => {
  const site = (import.meta.env.PUBLIC_SITE_URL ?? 'http://localhost:4321').replace(/\/+$/, '');
  const paths = [...STATIC_ROUTES];

  try {
    const [talks, speakers] = await Promise.all([
      listTalks({ pageSize: 100 }),
      listSpeakers({ pageSize: 100 }),
    ]);
    for (const talk of talks.data) paths.push(`/agenda/${talk.id}`);
    for (const speaker of speakers.data) paths.push(`/ponentes/${speaker.id}`);
  } catch {
    // Backend no disponible: el sitemap conserva al menos las rutas fijas.
  }

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    paths
      .map((path) => `  <url><loc>${xmlEscape(`${site}${path}`)}</loc></url>`)
      .join('\n') +
    '\n</urlset>\n';

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
