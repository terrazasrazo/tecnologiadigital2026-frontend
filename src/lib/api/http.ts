/** Helpers para los endpoints (API routes) propios del frontend en Astro. */
import type { APIRoute } from 'astro';
import { ApiError, apiUrl } from '../utils';
import { getAccessToken, tryRefreshSession } from '../auth';
import { apiFetch, BASE_URL } from './client';

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
 * Endpoint que reenvía la petición al backend añadiendo el access token de la
 * sesión (`Authorization`). Si el backend responde 401, renueva el access token
 * con el refresh token y reintenta una vez.
 *
 * La respuesta se pasa tal cual (JSON o binario, p. ej. PDF de constancias).
 */
export function authProxy(
  pathFor: (params: Record<string, string | undefined>) => string,
): APIRoute {
  return async ({ params, request, cookies, url }) => {
    const method = request.method.toUpperCase();
    const contentType = request.headers.get('content-type') ?? '';

    // El cuerpo se lee una sola vez para poder reintentar tras un 401.
    let body: BodyInit | undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      if (contentType.includes('multipart/form-data')) {
        body = await request.formData();
      } else {
        const text = await request.text();
        body = text || undefined;
      }
    }

    const target = `${apiUrl(BASE_URL, pathFor(params))}${url.search}`;

    const send = async (): Promise<Response> => {
      const headers = new Headers();
      const token = getAccessToken(cookies);
      if (token) headers.set('Authorization', `Bearer ${token}`);
      if (typeof body === 'string' && body) {
        headers.set('Content-Type', contentType || 'application/json');
      }
      return fetch(target, { method, headers, body, cache: 'no-store' });
    };

    try {
      let res = await send();
      if (res.status === 401 && (await tryRefreshSession(cookies))) {
        res = await send();
      }
      const outHeaders = new Headers();
      for (const name of ['content-type', 'content-disposition', 'cache-control']) {
        const value = res.headers.get(name);
        if (value) outHeaders.set(name, value);
      }
      return new Response(res.body, { status: res.status, headers: outHeaders });
    } catch {
      return errorResponse(
        new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor del evento.'),
      );
    }
  };
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
