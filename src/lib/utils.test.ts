import { describe, expect, it } from 'vitest';
import {
  ApiError,
  apiUrl,
  buildCheckInPath,
  buildCheckInUrl,
  capitalize,
  formatDuration,
  formatDate,
  isJson,
  parseQrContent,
  toLocalInputValue,
  toQuery,
} from './utils';

describe('formatDate', () => {
  it('formatea AAAA-MM-DD como dd/mm/aaaa', () => {
    expect(formatDate('2026-10-13')).toBe('13/10/2026');
  });

  it('acepta ISO completo', () => {
    expect(formatDate('2026-01-05T10:00:00.000Z')).toMatch(/0[1-9]\/01\/2026|1[0-3]\/01\/2026/);
  });
});

describe('formatDuration', () => {
  it('conviete minutos a horas y minutos', () => {
    expect(formatDuration(90)).toBe('1 h 30 min');
  });
  it('minutos exactos', () => {
    expect(formatDuration(60)).toBe('1 h');
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(0)).toBe('0 min');
  });
});

describe('toQuery', () => {
  it('omite undefined, null y cadena vacía', () => {
    expect(toQuery({ a: 1, b: undefined, c: null, d: '' })).toBe('?a=1');
  });
  it('devuelve cadena vacía si no hay nada', () => {
    expect(toQuery({})).toBe('');
    expect(toQuery({ a: undefined })).toBe('');
  });
  it('codifica espacios', () => {
    expect(toQuery({ q: 'hola mundo' })).toBe('?q=hola+mundo');
  });
});

describe('parseQrContent', () => {
  const makeJwt = (payload: Record<string, unknown>): string =>
    `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.firma`;

  it('extrae talkId y token de una URL de check-in', () => {
    const raw = makeJwt({ talkId: 42, purpose: 'attendance' });
    const url = `https://evento.test/app/checkin?talk=42&token=${raw}`;
    expect(parseQrContent(url)).toEqual({ talkId: 42, token: raw });
  });

  it('deriva talkId del token si la URL no trae ?talk', () => {
    const raw = makeJwt({ talkId: 7, purpose: 'attendance' });
    expect(parseQrContent(`https://evento.test/app/checkin?token=${raw}`)).toEqual({
      talkId: 7,
      token: raw,
    });
  });

  it('compatibilidad: acepta el token JWT en crudo', () => {
    const raw = makeJwt({ talkId: 42, purpose: 'attendance' });
    expect(parseQrContent(raw)).toEqual({ talkId: 42, token: raw });
  });

  it('acepta payload sin purpose', () => {
    expect(parseQrContent(makeJwt({ talkId: 7 }))).not.toBeNull();
  });

  it('rechaza purpose distinto de attendance', () => {
    expect(parseQrContent(makeJwt({ talkId: 42, purpose: 'other' }))).toBeNull();
  });

  it('rechaza talkId inválido', () => {
    expect(parseQrContent(makeJwt({ talkId: 0, purpose: 'attendance' }))).toBeNull();
    expect(parseQrContent(makeJwt({ talkId: -3 }))).toBeNull();
    expect(parseQrContent(makeJwt({ talkId: 'abc' }))).toBeNull();
    expect(parseQrContent(makeJwt({}))).toBeNull();
  });

  it('rechaza cadenas que no son JWT ni URL de check-in', () => {
    expect(parseQrContent('')).toBeNull();
    expect(parseQrContent('   ')).toBeNull();
    expect(parseQrContent('no-es-jwt')).toBeNull();
    expect(parseQrContent('a.b')).toBeNull();
    expect(parseQrContent('https://evento.test/otra-cosa')).toBeNull();
  });
});

describe('buildCheckInPath / buildCheckInUrl', () => {
  it('construye la ruta con talk y token', () => {
    expect(buildCheckInPath(5, 'abc')).toBe('/app/checkin?talk=5&token=abc');
  });

  it('construye la URL absoluta sin barras duplicadas', () => {
    expect(buildCheckInUrl('https://evento.test/', 5, 'abc')).toBe(
      'https://evento.test/app/checkin?talk=5&token=abc',
    );
  });
});

describe('apiUrl', () => {
  it('evita barras duplicadas', () => {
    expect(apiUrl('http://x/', '/api/talks')).toBe('http://x/api/talks');
    expect(apiUrl('http://x', 'api/talks')).toBe('http://x/api/talks');
  });
});

describe('toLocalInputValue', () => {
  it('genera AAAA-MM-DDTHH:mm en zona local', () => {
    const d = new Date(2026, 9, 20, 9, 5); // 20 oct 2026 09:05 local
    expect(toLocalInputValue(d.toISOString())).toBe('2026-10-20T09:05');
  });
});

describe('isJson', () => {
  it('detecta JSON válido', () => {
    expect(isJson('{"a":1}')).toBe(true);
    expect(isJson('no json')).toBe(false);
  });
});

describe('ApiError.from', () => {
  it('lee el cuerpo estandarizado', () => {
    const err = ApiError.from(409, {
      error: { code: 'TALK_TIME_CONFLICT', message: 'solape', details: { x: 1 } },
    });
    expect(err.code).toBe('TALK_TIME_CONFLICT');
    expect(err.status).toBe(409);
    expect(err.details).toEqual({ x: 1 });
  });

  it('cae en UNKNOWN con cuerpos no estándar', () => {
    const err = ApiError.from(500, { foo: 'bar' });
    expect(err.code).toBe('UNKNOWN');
    expect(err.status).toBe(500);
    expect(err.message).toBe('Error HTTP 500');
  });
});

describe('capitalize', () => {
  it('solo la primera letra', () => {
    expect(capitalize('lunes, 12 de oct')).toBe('Lunes, 12 de oct');
    expect(capitalize('')).toBe('');
  });
});
