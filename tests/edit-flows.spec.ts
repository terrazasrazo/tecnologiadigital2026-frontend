import { test, expect } from '@playwright/test';
import { USERS, login, trackPageErrors } from './helpers';

/**
 * Regresión del bug «POST a rutas PATCH → 404»: todas las islas de edición
 * deben enviar el método correcto y recibir 200 desde el proxy.
 */
test.describe('Flujos de edición (PATCH desde las islas)', () => {
  test('admin: activar y restaurar un usuario', async ({ page }) => {
    const errors = trackPageErrors(page);
    page.on('dialog', (d) => d.accept());
    await login(page, USERS.admin);
    await page.goto('/admin/usuarios');

    const isStatusPatch = (r: { request: () => { method: () => string }; url: () => string }) =>
      r.request().method() === 'PATCH' && /\/api\/users\/\d+\/status$/.test(new URL(r.url()).pathname);

    // Fila de un usuario activo (la fila del propio admin no tiene toggle).
    const row = page
      .locator('tbody tr')
      .filter({ has: page.getByRole('button', { name: 'Desactivar', exact: true }) })
      .first();
    await expect(row).toBeVisible();
    const email = (await row.locator('td').filter({ hasText: /@/ }).first().textContent())?.trim();
    expect(email).toBeTruthy();

    // Desactivar → PATCH 200
    const [resp1] = await Promise.all([
      page.waitForResponse(isStatusPatch),
      row.getByRole('button', { name: 'Desactivar', exact: true }).click(),
    ]);
    expect(resp1.status()).toBe(200);

    // Tras la recarga, ese mismo usuario queda inactivo...
    const rowAfter = page.locator('tbody tr').filter({ hasText: email! });
    await expect(rowAfter.getByRole('button', { name: 'Activar', exact: true })).toBeVisible();

    // ...y se restaura con un segundo PATCH
    const [resp2] = await Promise.all([
      page.waitForResponse(isStatusPatch),
      rowAfter.getByRole('button', { name: 'Activar', exact: true }).click(),
    ]);
    expect(resp2.status()).toBe(200);
    await expect(
      page
        .locator('tbody tr')
        .filter({ hasText: email! })
        .getByRole('button', { name: 'Desactivar', exact: true }),
    ).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('asistente: guardar perfil (PATCH /api/users/me)', async ({ page }) => {
    const errors = trackPageErrors(page);
    await login(page, USERS.asistente);
    await page.goto('/app/perfil');

    await page.getByLabel('Teléfono').fill('5500000000');
    const [resp] = await Promise.all([
      page.waitForResponse(
        (r) => r.request().method() === 'PATCH' && new URL(r.url()).pathname === '/api/users/me',
      ),
      page.getByRole('button', { name: 'Guardar cambios' }).click(),
    ]);
    expect(resp.status()).toBe(200);
    await expect(page.locator('[role="status"]')).toContainText('Datos actualizados correctamente');
    expect(errors).toEqual([]);
  });

  test('admin: guardar configuración (PATCH /api/settings)', async ({ page }) => {
    const errors = trackPageErrors(page);
    await login(page, USERS.admin);
    await page.goto('/admin/configuracion');

    const [resp] = await Promise.all([
      page.waitForResponse(
        (r) => r.request().method() === 'PATCH' && new URL(r.url()).pathname === '/api/settings',
      ),
      page.getByRole('button', { name: 'Guardar configuración' }).click(),
    ]);
    expect(resp.status()).toBe(200);
    await expect(page.getByText(/Guardado\. El nuevo umbral/)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('organizador: editar ponencia sin errores (PATCH /api/talks/:id)', async ({ page }) => {
    const errors = trackPageErrors(page);
    await login(page, USERS.organizador);
    await page.goto('/organizador/ponencias');

    await page.getByRole('link', { name: 'Editar' }).first().click();
    await page.waitForURL(/\/editar$/, { timeout: 10_000 });

    const [resp] = await Promise.all([
      page.waitForResponse(
        (r) => r.request().method() === 'PATCH' && /^\/api\/talks\/\d+$/.test(new URL(r.url()).pathname),
      ),
      page.getByRole('button', { name: 'Guardar cambios' }).click(),
    ]);
    expect(resp.status()).toBe(200);
    await expect(page.locator('[role="alert"]')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});
