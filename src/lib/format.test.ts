import { describe, expect, it } from 'vitest';
import { formatClock, timeFormatFromCookie } from './format';

describe('formatClock', () => {
  it('usa 24 horas por defecto con strings de la base de datos', () => {
    expect(formatClock('09:05:00')).toBe('09:05');
    expect(formatClock('14:30')).toBe('14:30');
    expect(formatClock('10:15:00')).toBe('10:15');
  });

  it('convierte ISO a la hora local en formato 24 h', () => {
    const iso = '2026-11-06T16:25:00.000Z';
    const d = new Date(iso);
    const expected = `${String(d.getHours()).padStart(2, '0')}:25`;
    expect(formatClock(iso, '24h')).toBe(expected);
  });

  it('formatea 12 horas con AM/PM', () => {
    expect(formatClock('14:30', '12h')).toBe('2:30 PM');
    expect(formatClock('00:15', '12h')).toBe('12:15 AM');
    expect(formatClock('12:00', '12h')).toBe('12:00 PM');
  });

  it('devuelve el valor original si no se puede interpretar', () => {
    expect(formatClock('no-es-hora')).toBe('no-es-hora');
  });
});

describe('timeFormatFromCookie', () => {
  it('es 24 h sin cookie o con valores desconocidos', () => {
    expect(timeFormatFromCookie(null)).toBe('24h');
    expect(timeFormatFromCookie('otra=x; timeFormat=24h')).toBe('24h');
    expect(timeFormatFromCookie('session=abc')).toBe('24h');
  });

  it('lee 12 h de la cookie', () => {
    expect(timeFormatFromCookie('timeFormat=12h')).toBe('12h');
    expect(timeFormatFromCookie('session=abc; timeFormat=12h; otra=x')).toBe('12h');
  });
});
