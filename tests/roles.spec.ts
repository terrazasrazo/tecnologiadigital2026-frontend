import { test, expect } from '@playwright/test';
import { USERS, login, trackPageErrors, waitForHydration } from './helpers';

test.describe('Flujos por rol', () => {
  test('asistente: login → su panel con navegación de rol', async ({ page }) => {
    const errors = trackPageErrors(page);
    await login(page, USERS.asistente);

    expect(new URL(page.url()).pathname).toBe('/app/dashboard');
    await expect(page.getByRole('link', { name: 'Check-in', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Constancia', exact: true }).first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('asistente: no puede entrar al panel de admin', async ({ page }) => {
    await login(page, USERS.asistente);
    await page.goto('/admin/usuarios');
    await page.waitForURL((url) => url.pathname.startsWith('/app/'), { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe('/app/dashboard');
  });

  test('organizador: genera el QR de una ponencia (isla qrcode)', async ({ page }) => {
    const errors = trackPageErrors(page);
    await login(page, USERS.organizador);

    await page.goto('/organizador/ponencias');
    await expect(page.locator('h1').first()).toBeVisible();

    await page.getByRole('link', { name: 'Asistencia' }).first().click();
    await page.waitForURL(/\/asistencia$/, { timeout: 10_000 });

    const qrButton = page.getByRole('button', { name: 'Generar QR' });
    await qrButton.scrollIntoViewIfNeeded();
    await waitForHydration(page, 'Generar QR');
    await qrButton.click();

    await expect(page.locator('img[alt*="QR"]')).toBeVisible();

    // El QR puede descargarse como PNG…
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar PNG' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.png$/);

    // …y enviarse por correo a los ponentes asociados.
    await expect(
      page.getByRole('button', { name: 'Enviar por correo a los ponentes' }),
    ).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('admin: estadísticas y usuarios sin errores', async ({ page }) => {
    const errors = trackPageErrors(page);
    await login(page, USERS.admin);

    await page.goto('/admin/estadisticas');
    await expect(page.getByText('Tasa de asistencia')).toBeVisible();

    await page.goto('/admin/usuarios');
    await expect(page.getByRole('link', { name: 'Nuevo usuario' })).toBeVisible();

    expect(errors).toEqual([]);
  });
});
