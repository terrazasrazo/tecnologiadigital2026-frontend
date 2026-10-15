import { describe, expect, it } from 'vitest';
import { fieldErrors, messageFor } from './errorMessages';

describe('messageFor', () => {
  it('devuelve el mensaje conocido del código', () => {
    expect(messageFor('INVALID_CREDENTIALS')).toBe('Correo o contraseña incorrectos.');
    expect(messageFor('TALK_TIME_CONFLICT')).toBe('La horaria se solapa con otra ponencia.');
  });

  it('usa el fallback del API para códigos desconocidos', () => {
    expect(messageFor('CODE_INVENTADO', 'mensaje del backend')).toBe('mensaje del backend');
  });

  it('mensaje genérico sin código ni fallback', () => {
    expect(messageFor(undefined)).toBe('Ocurrió un error. Inténtalo de nuevo.');
    expect(messageFor('')).toBe('Ocurrió un error. Inténtalo de nuevo.');
  });
});

describe('fieldErrors', () => {
  it('convierte los issues de Zod en mapa campo→mensaje', () => {
    const details = [
      { path: ['body', 'email'], message: 'Correo inválido' },
      { path: ['body', 'password'], message: 'Mínimo 8 caracteres' },
    ];
    expect(fieldErrors(details)).toEqual({
      email: 'Correo inválido',
      password: 'Mínimo 8 caracteres',
    });
  });

  it('respeta el primer mensaje por campo', () => {
    const details = [
      { path: ['body', 'email'], message: 'primero' },
      { path: ['query', 'email'], message: 'segundo' },
    ];
    expect(fieldErrors(details)).toEqual({ email: 'primero' });
  });

  it('ignora entradas malformadas y no arrays', () => {
    expect(fieldErrors(undefined)).toEqual({});
    expect(fieldErrors({})).toEqual({});
    expect(fieldErrors('nope')).toEqual({});
    expect(fieldErrors([{ path: ['body', 'x'] }])).toEqual({}); // sin message
    expect(fieldErrors([null, { message: 'hola' }])).toEqual({}); // sin path
  });
});
