import type { APIRoute } from 'astro';
import type { User } from '../../../lib/types';
import { getAccessToken, setSessionUser } from '../../../lib/auth';
import { apiFetch } from '../../../lib/api/client';
import { errorResponse, json } from '../../../lib/api/http';

/**
 * Edición del propio perfil: `PATCH /api/users/me`.
 * Además de reenviar la petición, actualiza la cookie legible del perfil para
 * que el UI (nombre, rol) refleje los cambios sin recargar.
 */
export const PATCH: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return json({ error: { code: 'VALIDATION_ERROR', message: 'Cuerpo inválido' } }, 400);
    }
    const accessToken = getAccessToken(cookies);
    if (!accessToken) {
      return json({ error: { code: 'UNAUTHORIZED', message: 'Sesión requerida' } }, 401);
    }
    const user = await apiFetch<User>('/api/users/me', {
      method: 'PATCH',
      body,
      accessToken,
    });
    setSessionUser(cookies, user);
    return json(user);
  } catch (err) {
    return errorResponse(err);
  }
};
