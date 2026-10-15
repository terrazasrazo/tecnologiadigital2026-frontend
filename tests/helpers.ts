import type { Page } from '@playwright/test';

export const USERS = {
  asistente: { email: 'asistente@tecnologiadigital.dev', password: 'Asistente123!' },
  organizador: { email: 'organizador@tecnologiadigital.dev', password: 'Organizador123!' },
  admin: { email: 'admin@tecnologiadigital.dev', password: 'Admin123!' },
} as const;

export interface TestUser {
  email: string;
  password: string;
}

/** Inicia sesión por la UI (también valida la hidratación del formulario). */
export async function login(page: Page, user: TestUser): Promise<void> {
  await page.goto('/auth/login');
  await page.getByLabel('Correo electrónico').fill(user.email);
  await page.getByLabel('Contraseña').fill(user.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.startsWith('/auth/'), { timeout: 15_000 });
}

/** Recolecta errores no capturados (fallas de hidratación de las islas). */
export function trackPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  return errors;
}

/**
 * Espera a que React haya hidratado el botón (presencia de props de React),
 * para que el click no se pierda antes de montar los handlers.
 */
export async function waitForHydration(page: Page, buttonText: string): Promise<void> {
  await page.waitForFunction((text) => {
    const btn = [...document.querySelectorAll('button')].find(
      (b) => b.textContent?.includes(text) ?? false,
    );
    return Boolean(btn && Object.keys(btn).some((k) => k.startsWith('__reactProps')));
  }, buttonText, { timeout: 10_000 });
}
