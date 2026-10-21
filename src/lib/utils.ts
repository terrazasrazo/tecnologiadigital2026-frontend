import { ROUTES } from './constants';
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

/** Extrae `talkId` del payload de un JWT sin verificar la firma (solo lectura). */
function decodeTalkId(token: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64)) as { talkId?: unknown; purpose?: unknown };
    if (payload.purpose !== undefined && payload.purpose !== 'attendance') return null;
    const talkId = Number(payload.talkId);
    if (!Number.isInteger(talkId) || talkId <= 0) return null;
    return talkId;
  } catch {
    return null;
  }
}

/**
 * Ruta del frontend a la que apunta el QR de una ponencia: la página de
 * confirmación de check-in, con el `talkId` y el token firmado en la query.
 *
 * El QR contiene una URL completa para que la app de cámara nativa del
 * teléfono la abra directamente (no requiere escáner en el navegador).
 */
export function buildCheckInPath(talkId: number, token: string): string {
  return `${ROUTES.checkin}${toQuery({ talk: talkId, token })}`;
}

/** URL absoluta del QR de asistencia, usando el origen del frontend. */
export function buildCheckInUrl(origin: string, talkId: number, token: string): string {
  return `${origin.replace(/\/+$/, '')}${buildCheckInPath(talkId, token)}`;
}

/**
 * Interpreta el contenido escaneado de un QR de asistencia.
 *
 * Acepta tanto la URL completa que genera el frontend
 * (`https://…/app/checkin?talk=1&token=…`) como, por compatibilidad, el token
 * JWT "en crudo" de QRs antiguos. Devuelve `talkId` y `token`, o `null` si el
 * contenido no es un QR de asistencia válido.
 */
export function parseQrContent(raw: string): { talkId: number; token: string } | null {
  const value = raw.trim();
  if (!value) return null;

  // Formato actual: URL con `?talk=&token=`.
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const token = url.searchParams.get('token')?.trim();
      if (!token) return null;
      const talk = Number(url.searchParams.get('talk'));
      if (Number.isInteger(talk) && talk > 0) return { talkId: talk, token };
      // Si falta `talk`, se deriva del propio token.
      const talkId = decodeTalkId(token);
      return talkId ? { talkId, token } : null;
    } catch {
      return null;
    }
  }

  // Compatibilidad: token JWT en crudo.
  const talkId = decodeTalkId(value);
  return talkId ? { talkId, token: value } : null;
}

/** Une la URL base de la API con un path, evitando barras duplicadas. */
export function apiUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

/**
 * Convierte un ISO a valor para `<input type="datetime-local">` (`AAAA-MM-DDTHH:mm`)
 * usando la zona horaria local.
 */
export function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
