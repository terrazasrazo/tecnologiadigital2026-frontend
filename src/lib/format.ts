/** Preferencia de formato de hora del usuario: 24 h (default) o 12 h (AM/PM). */
export type TimeFormat = '24h' | '12h';

/** Nombre de la cookie que guarda la preferencia (legible por SSR y por las islas). */
export const TIME_FORMAT_COOKIE = 'timeFormat';

/** Lee la preferencia de una cabecera `Cookie` (24 h si no está definida). */
export function timeFormatFromCookie(cookieHeader: string | null | undefined): TimeFormat {
  return /(?:^|;\s*)timeFormat=12h(?:;|$)/.test(cookieHeader ?? '') ? '12h' : '24h';
}

/**
 * Formatea una hora al formato indicado. Acepta strings de tiempo de la base
 * de datos (`"10:00"`, `"10:00:00"`) e ISO completos (`"…T16:05:00.000Z"`, que
 * se convierten a la hora local). Default: 24 h.
 */
export function formatClock(value: string, format: TimeFormat = '24h'): string {
  const timeMatch = /^(\d{2}):(\d{2})/.exec(value);
  let hours: number;
  let minutes: number;

  if (timeMatch && !value.includes('T')) {
    hours = Number(timeMatch[1]);
    minutes = Number(timeMatch[2]);
  } else {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    hours = date.getHours();
    minutes = date.getMinutes();
  }

  const mm = String(minutes).padStart(2, '0');
  if (format === '24h') {
    return `${String(hours).padStart(2, '0')}:${mm}`;
  }
  return `${hours % 12 || 12}:${mm} ${hours >= 12 ? 'PM' : 'AM'}`;
}
