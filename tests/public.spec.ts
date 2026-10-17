import { test, expect } from '@playwright/test';
import { trackPageErrors } from './helpers';

test.describe('Páginas públicas y SEO', () => {
  test('landing: título, Open Graph, canonical y JSON-LD sin errores', async ({ page }) => {
    const errors = trackPageErrors(page);
    const res = await page.goto('/');
    expect(res?.status()).toBe(200);

    await expect(page).toHaveTitle(/Coloquio de Tecnología Digital 2026/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Coloquio de Tecnología Digital 2026/);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/$/);

    const ldText = await page.locator('script[type="application/ld+json"]').textContent();
    expect(ldText).toBeTruthy();
    const ld = JSON.parse(ldText!) as { '@type'?: string; startDate?: string };
    expect(ld['@type']).toBe('Event');
    expect(ld.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    expect(errors).toEqual([]);
  });

  test('agenda y ponentes renderizan sin errores', async ({ page }) => {
    const errors = trackPageErrors(page);

    await page.goto('/agenda');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).toHaveTitle(/Agenda · Coloquio de Tecnología Digital 2026/);

    await page.goto('/ponentes');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).toHaveTitle(/Ponentes · Coloquio de Tecnología Digital 2026/);

    expect(errors).toEqual([]);
  });

  test('ruta inexistente responde 404 con la página amigable', async ({ page }) => {
    const res = await page.goto('/ruta-que-no-existe-xyz');
    expect(res?.status()).toBe(404);
    await expect(page.getByText('Página no encontrada')).toBeVisible();
    await expect(page.locator('a', { hasText: 'Volver al inicio' })).toBeVisible();
  });

  test('robots.txt bloquea zonas privadas y anuncia el sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.ok()).toBeTruthy();
    expect(res.headers()['content-type']).toContain('text/plain');
    const body = await res.text();
    expect(body).toContain('User-agent: *');
    expect(body).toContain('Disallow: /admin/');
    expect(body).toContain('Disallow: /app/');
    expect(body).toContain('Sitemap: ');
  });

  test('sitemap.xml lista rutas públicas', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.ok()).toBeTruthy();
    expect(res.headers()['content-type']).toContain('application/xml');
    const body = await res.text();
    expect(body).toContain('<urlset');
    expect(body).toContain('/</loc>'); // la landing
    expect(body).toContain('/agenda</loc>');
    // Detalles de ponencias/ponentes si el backend está disponible.
    const entries = (body.match(/<url>/g) ?? []).length;
    expect(entries).toBeGreaterThanOrEqual(4);
  });

  test('formulario de login: error visible (isla React hidratada)', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/auth/login');
    await page.getByLabel('Correo electrónico').fill('no-existe@tecnologiadigital.dev');
    await page.getByLabel('Contraseña').fill('WrongPass123!');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('[role="alert"]')).toHaveText(/Correo o contraseña incorrectos/);
    expect(errors).toEqual([]);
  });
});
