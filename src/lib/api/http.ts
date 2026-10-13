/** Helpers para los endpoints (API routes) propios del frontend en Astro. */
import type { APIRoute } from 'astro';
import { ApiError } from '../utils';
import { apiFetch } from './client';

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

/**
 * Convierte cualquier error en la respuesta estándar del backend
 * (`{ error: { code, message, details } }`) conservando el código HTTP.
 */
export function errorResponse(err: unknown): Response {
  if (err instanceof ApiError) {
    const status = err.status >= 400 && err.status < 600 ? err.status : 502;
    const details = err.details && Object.keys(err.details).length > 0 ? err.details : undefined;
    return json(
      { error: { code: err.code, message: err.message, ...(details ? { details } : {}) } },
      status,
    );
  }
  const message = err instanceof Error ? err.message : 'Error interno';
  return json({ error: { code: 'INTERNAL_ERROR', message } }, 500);
}

/**
 * Endpoint que reenvía el body JSON al backend y devuelve su respuesta.
 * Uso: `export const POST = proxyPost('/api/auth/register', 201);`
 */
export function proxyPost(path: string, successStatus = 200): APIRoute {
  return async ({ request }) => {
    try {
      const body = await request.json().catch(() => ({}));
      const data = await apiFetch(path, { method: 'POST', body });
      return json(data, successStatus);
    } catch (err) {
      return errorResponse(err);
    }
  };
}
