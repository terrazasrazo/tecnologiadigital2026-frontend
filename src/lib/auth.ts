/**
 * Gestión de la sesión en el servidor de Astro.
 *
 * - El **access token** y el **refresh token** se guardan en cookies httpOnly,
 *   por lo que nunca son legibles desde el navegador.
 * - El **perfil del usuario** se guarda en una cookie legible solo para
 *   pintar la UI (nombre, rol); no contiene secretos.
 */
import type { AstroCookies } from 'astro';
import type { AuthTokens, User } from './types';
import { COOKIES } from './constants';
import { refresh as refreshAuth } from './api/auth';

const SECURE = import.meta.env.PROD;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

/** Guarda tokens y perfil tras un login/refresh exitoso. */
export function setSession(cookies: AstroCookies, tokens: AuthTokens, user: User): void {
  cookies.set(COOKIES.accessToken, tokens.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: SECURE,
    path: '/',
    // El access token expira solo (en segundos) gracias a maxAge del cookie.
    maxAge: Math.max(tokens.expiresIn, 60),
  });
  cookies.set(COOKIES.refreshToken, tokens.refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: SECURE,
    path: '/',
    maxAge: REFRESH_MAX_AGE,
  });
  cookies.set(COOKIES.sessionUser, JSON.stringify(user), {
    httpOnly: false,
    sameSite: 'lax',
    secure: SECURE,
    path: '/',
    maxAge: REFRESH_MAX_AGE,
  });
}

/** Elimina toda la sesión. */
export function clearSession(cookies: AstroCookies): void {
  for (const name of Object.values(COOKIES)) {
    cookies.delete(name, { path: '/' });
  }
}

/**
 * Actualiza solo la cookie legible del perfil (p. ej. tras editar el perfil
 * desde `/app/perfil`), manteniendo los tokens intactos.
 */
export function setSessionUser(cookies: AstroCookies, user: User): void {
  cookies.set(COOKIES.sessionUser, JSON.stringify(user), {
    httpOnly: false,
    sameSite: 'lax',
    secure: SECURE,
    path: '/',
    maxAge: REFRESH_MAX_AGE,
  });
}

export function getAccessToken(cookies: AstroCookies): string | null {
  return cookies.get(COOKIES.accessToken)?.value ?? null;
}

export function getRefreshToken(cookies: AstroCookies): string | null {
  return cookies.get(COOKIES.refreshToken)?.value ?? null;
}

/** Perfil del usuario desde la cookie legible (null si no hay o está corrupta). */
export function getSessionUser(cookies: AstroCookies): User | null {
  const raw = cookies.get(COOKIES.sessionUser)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

/**
 * Rota el refresh token para obtener un nuevo access token.
 * `false` si no hay refresh token o si falla (en cuyo caso se limpia la sesión,
 * ya que el backend revoca tokens reutilizados).
 */
export async function tryRefreshSession(cookies: AstroCookies): Promise<boolean> {
  const refreshToken = getRefreshToken(cookies);
  if (!refreshToken) return false;
  try {
    const auth = await refreshAuth(refreshToken);
    setSession(cookies, auth.tokens, auth.user);
    return true;
  } catch {
    clearSession(cookies);
    return false;
  }
}
