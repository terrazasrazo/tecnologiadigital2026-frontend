import type { ApiErrorBody } from './types';

/**
 * Error de la API con el código estandarizado del backend
 * (`{ error: { code, message, details } }`).
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static from(status: number, body: unknown): ApiError {
    const err = (body as ApiErrorBody | undefined)?.error;
    if (err?.code) {
      return new ApiError(status, err.code, err.message, err.details ?? {});
    }
    return new ApiError(status, 'UNKNOWN', `Error HTTP ${status}`, {});
  }
}

/** Crea una fecha local a partir de una cadena `AAAA-MM-DD` (evita el desfase de zona horaria). */
function parseDateOnly(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Formatea una fecha como `dd/mm/aaaa`. Acepta ISO o `AAAA-MM-DD`. */
export function formatDate(iso: string): string {
  const date = parseDateOnly(iso) ?? new Date(iso);
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Formatea una fecha con día de la semana: `lunes, 12 de octubre de 2026`. */
export function formatDateLong(iso: string): string {
  const date = parseDateOnly(iso) ?? new Date(iso);
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Etiqueta corta de día para la agenda: `lun 12 oct`. */
export function formatDayLabel(iso: string): string {
  const date = parseDateOnly(iso) ?? new Date(iso);
  return date.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** Formatea una fecha ISO con hora: `12/10/2026 09:30`. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Convierte minutos en texto legible: `90` → `1 h 30 min`. */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

/** Capitaliza la primera letra (útil para labels de días). */
export function capitalize(text: string): string {
  return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}

/** Construye una query string a partir de un objeto, omitiendo undefined y null. */
export function toQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    qs.set(key, String(value));
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

/** Une la URL base de la API con un path, evitando barras duplicadas. */
export function apiUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

/** Determina si una cadena es un JSON válido. */
export function isJson(value: string): boolean {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}
