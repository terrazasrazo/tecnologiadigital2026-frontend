/**
 * Endpoints propios del frontend para la sesión:
 *
 * - `GET /api/session`    → usuario de sesión (renueva el access token si expiró)
 * - `POST /api/session`   → login (guarda cookies httpOnly y devuelve el usuario)
 * - `DELETE /api/session` → logout (revoca el refresh token y limpia cookies)
 */
import type { APIRoute } from 'astro';
import type { AuthResponse } from '../../lib/types';
import { HOME_BY_ROLE } from '../../lib/constants';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getSessionUser,
  setSession,
  tryRefreshSession,
} from '../../lib/auth';
import { apiFetch } from '../../lib/api/client';
import { errorResponse, json } from '../../lib/api/http';

export const GET: APIRoute = async ({ cookies }) => {
  try {
    if (!getAccessToken(cookies)) {
      await tryRefreshSession(cookies);
    }
    const user = getAccessToken(cookies) ? getSessionUser(cookies) : null;
    return json({ user });
  } catch (err) {
    return errorResponse(err);
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return json({ error: { code: 'VALIDATION_ERROR', message: 'Cuerpo inválido' } }, 400);
    }

    const auth = await apiFetch<AuthResponse>('/api/auth/login', { method: 'POST', body });
    setSession(cookies, auth.tokens, auth.user);

    // Ruta de inicio según el rol, para que el cliente redirija sin conocerla.
    return json({ user: auth.user, home: HOME_BY_ROLE[auth.user.role.name] });
  } catch (err) {
    return errorResponse(err);
  }
};

export const DELETE: APIRoute = async ({ cookies }) => {
  const refreshToken = getRefreshToken(cookies);
  // La revocación es best-effort: aunque falle, se limpia la sesión local.
  if (refreshToken) {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST', body: { refreshToken } });
    } catch {
      // ignorar
    }
  }
  clearSession(cookies);
  return json({ success: true });
};
