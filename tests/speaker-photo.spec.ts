import { test, expect } from '@playwright/test';
import path from 'node:path';
import { USERS, login, trackPageErrors } from './helpers';

test('ponente: subir fotografía de perfil se persiste y el archivo se sirve', async ({ page }) => {
  const errors = trackPageErrors(page);
  await login(page, USERS.ponente);
  await page.goto('/ponente/perfil');

  const fileInput = page.locator('input[type="file"]');
  await fileInput.scrollIntoViewIfNeeded();
  await fileInput.setInputFiles(path.resolve(process.cwd(), 'tests/fixtures/photo.png'));

  // Vista previa local (blob:) inmediata tras elegir el archivo.
  const preview = page.locator('img[alt="Vista previa de la fotografía"]');
  await expect(preview).toBeVisible();

  // El upload debe viajar como multipart/PATCH por el proxy y responder 200.
  const [resp] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.request().method() === 'PATCH' && /^\/api\/speakers\/\d+$/.test(new URL(r.url()).pathname),
    ),
    page.getByRole('button', { name: 'Subir fotografía' }).click(),
  ]);
  expect(resp.status()).toBe(200);

  // Tras la recarga la foto viene del backend y el archivo debe cargar de verdad.
  await expect(preview).toBeVisible();
  await expect
    .poll(async () => preview.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
    .toBe(true);
  await expect(preview).toHaveAttribute('src', /\/uploads\/speakers\//);

  expect(errors).toEqual([]);
});
