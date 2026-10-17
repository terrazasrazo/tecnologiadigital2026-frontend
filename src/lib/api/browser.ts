/**
 * Fetch del lado del navegador para los endpoints propios de Astro
 * (`/api/session`, `/api/auth/*`, proxies autenticados). El backend nunca se
 * llama desde el cliente.
 */

export class ClientApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ClientApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Núcleo común: fetch + parseo de JSON + traducción de errores a ClientApiError. */
async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { credentials: 'same-origin', ...init });
  } catch {
    throw new ClientApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor.');
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string; details?: unknown } } | null)
      ?.error;
    throw new ClientApiError(
      res.status,
      err?.code ?? 'UNKNOWN',
      err?.message ?? `Error ${res.status}`,
      err?.details,
    );
  }

  return data as T;
}

/** POST JSON a un endpoint de Astro. Lanza `ClientApiError` ante fallos. */
export async function postJson<T = unknown>(url: string, body?: unknown): Promise<T> {
  return requestJson<T>(url, {
    method: 'POST',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/** PATCH JSON a un endpoint de Astro (rutas que solo exportan `PATCH`). */
export async function patchJson<T = unknown>(url: string, body?: unknown): Promise<T> {
  return requestJson<T>(url, {
    method: 'PATCH',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/** DELETE a un endpoint de Astro. Lanza `ClientApiError` ante fallos. */
export async function deleteJson<T = unknown>(url: string): Promise<T> {
  return requestJson<T>(url, { method: 'DELETE' });
}

/** GET JSON a un endpoint de Astro. Lanza `ClientApiError` ante fallos. */
export async function getJson<T = unknown>(url: string): Promise<T> {
  return requestJson<T>(url, { method: 'GET' });
}

/**
 * Envía `multipart/form-data` (p. ej. con archivos). El navegador añade el
 * `Content-Type` con el boundary automáticamente.
 */
export async function sendForm<T = unknown>(
  url: string,
  method: 'POST' | 'PATCH' | 'PUT',
  formData: FormData,
): Promise<T> {
  return requestJson<T>(url, { method, body: formData });
}
