/**
 * Cliente HTTP server-side para la API REST del backend.
 *
 * Todas las llamadas se hacen desde el servidor de Astro (SSR), por lo que el
 * access token viaja en la cabecera `Authorization` sin exponerse al cliente.
 */
import { API_PREFIX } from '../constants';
import { ApiError, apiUrl, toQuery } from '../utils';

/** URL base del backend (variable de entorno `API_BASE_URL`). */
export const BASE_URL: string = import.meta.env.API_BASE_URL ?? 'http://localhost:3000';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  /** Query string; se omiten valores `undefined`, `null` y vacíos. */
  query?: object;
  /** Cuerpo JSON. Para multipart usa `formData`. */
  body?: unknown;
  /** Access token que viaja en `Authorization: Bearer`. */
  accessToken?: string | null;
  headers?: Record<string, string>;
  /** `AbortSignal` opcional (timeouts). */
  signal?: AbortSignal;
}

type QueryValue = string | number | boolean | undefined | null;

function buildUrl(path: string, query?: object): string {
  const url = apiUrl(BASE_URL, path);
  if (!query) return url;
  return `${url}${toQuery(query as Record<string, QueryValue>)}`;
}

function buildHeaders(opts: RequestOptions): Headers {
  const headers = new Headers(opts.headers);
  if (opts.accessToken) {
    headers.set('Authorization', `Bearer ${opts.accessToken}`);
  }
  if (opts.body !== undefined && !(opts.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

function serializeBody(body: unknown): BodyInit | undefined {
  if (body === undefined || body === null) return undefined;
  if (body instanceof FormData) return body;
  return JSON.stringify(body);
}

/** Lanza `ApiError` si la respuesta no fue exitosa. */
async function parseOrThrow(res: Response): Promise<unknown> {
  const text = await res.text();
  let json: unknown = undefined;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      // Respuesta no JSON (error de proxy o HTML): se conserva como mensaje.
    }
  }
  if (!res.ok) {
    throw ApiError.from(res.status, json);
  }
  return json;
}

/**
 * Ejecuta una petición a la API y devuelve el JSON tipado.
 * Lanza `ApiError` ante cualquier fallo (HTTP o de red).
 */
export async function apiFetch<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method: opts.method ?? 'GET',
      headers: buildHeaders(opts),
      body: serializeBody(opts.body),
      signal: opts.signal,
      cache: 'no-store',
    });
  } catch (cause) {
    throw new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor del evento.', {
      cause: String(cause),
    });
  }
  return (await parseOrThrow(res)) as T;
}

/**
 * Ejecuta una petición y devuelve la `Response` cruda (para descargas PDF u
 * otros binarios). Lanza `ApiError` ante errores HTTP.
 */
export async function apiRaw(path: string, opts: RequestOptions = {}): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method: opts.method ?? 'GET',
      headers: buildHeaders(opts),
      body: serializeBody(opts.body),
      signal: opts.signal,
      cache: 'no-store',
    });
  } catch (cause) {
    throw new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor del evento.', {
      cause: String(cause),
    });
  }
  if (!res.ok) {
    await parseOrThrow(res); // lanza ApiError con el cuerpo del error
  }
  return res;
}

/** Ruta de salud del backend (`GET /health`). */
export function healthPath(): string {
  return API_PREFIX === '/api' ? '/health' : '/health';
}

/**
 * Convierte rutas públicas del backend (fotografías de ponentes, etc.) en URLs
 * absolutas. El backend devuelve rutas tipo `/uploads/ponentes/x.jpg`, que el
 * navegador no puede resolver contra el origen del frontend.
 */
export function publicUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return apiUrl(BASE_URL, path);
}
