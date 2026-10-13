/**
 * `POST /logout` — cierra la sesión desde un formulario HTML (sin JS):
 * revoca el refresh token en el backend, limpia las cookies y redirige al home.
 */
import type { APIRoute } from 'astro';
import { clearSession, getRefreshToken } from '../lib/auth';
import { apiFetch } from '../lib/api/client';

function doLogout(cookies: Parameters<typeof clearSession>[0]): void {
  const refreshToken = getRefreshToken(cookies);
  if (refreshToken) {
    // Best-effort: el fallo de revocación no debe impedir cerrar sesión.
    void apiFetch('/api/auth/logout', { method: 'POST', body: { refreshToken } }).catch(() => {});
  }
  clearSession(cookies);
}

export const POST: APIRoute = async ({ cookies, redirect }) => {
  doLogout(cookies);
  return redirect('/', 303);
};

export const GET: APIRoute = async ({ cookies, redirect }) => {
  doLogout(cookies);
  return redirect('/', 303);
};
