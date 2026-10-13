/**
 * Middleware de autenticación y autorización.
 *
 * - Renueva el access token con el refresh token cuando expira.
 * - Protege las rutas `/app`, `/ponente`, `/organizador` y `/admin` según rol.
 * - Evita que usuarios con sesión visiten las páginas de autenticación.
 */
import { defineMiddleware } from 'astro:middleware';
import type { RoleName } from '../lib/types';
import { HOME_BY_ROLE, ROUTES } from '../lib/constants';
import { clearSession, getAccessToken, getSessionUser, tryRefreshSession } from '../lib/auth';

/** Prefijos de ruta protegidos y roles admitidos en cada uno. */
const PROTECTED: Array<{ prefix: string; roles: RoleName[] }> = [
  { prefix: '/app', roles: ['asistente'] },
  { prefix: '/ponente', roles: ['ponente'] },
  { prefix: '/organizador', roles: ['organizador'] },
  { prefix: '/admin', roles: ['admin'] },
];

function matches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const { cookies, locals } = context;

  // Las rutas propias de API y los estáticos no aplican.
  if (pathname.startsWith('/api/') || pathname.startsWith('/_')) {
    return next();
  }

  // 1. Obtener un access token vigente (renovando con el refresh si hace falta).
  let accessToken = getAccessToken(cookies);
  if (!accessToken) {
    await tryRefreshSession(cookies);
    accessToken = getAccessToken(cookies);
  }

  const user = accessToken ? getSessionUser(cookies) : null;
  locals.accessToken = accessToken && user ? accessToken : null;
  locals.user = locals.accessToken ? user : null;

  const session = Boolean(locals.user);

  // 2. Páginas de autenticación: si ya hay sesión, redirigir al panel del rol.
  if (pathname.startsWith('/auth/') && session && locals.user) {
    return context.redirect(HOME_BY_ROLE[locals.user.role.name]);
  }

  // 3. Rutas protegidas: requieren sesión y rol adecuado.
  const route = PROTECTED.find((r) => matches(pathname, r.prefix));
  if (route) {
    if (!locals.user) {
      clearSessionIfStale(cookies, session);
      const next = encodeURIComponent(pathname + context.url.search);
      return context.redirect(`${ROUTES.login}?redirect=${next}`);
    }
    if (!route.roles.includes(locals.user.role.name)) {
      // Sesión válida pero rol incorrecto: al panel propio del usuario.
      return context.redirect(HOME_BY_ROLE[locals.user.role.name]);
    }
  }

  return next();
});

/** Limpia cookies huérfanas cuando no hay sesión usable. */
function clearSessionIfStale(cookies: Parameters<typeof clearSession>[0], hasSession: boolean): void {
  if (!hasSession) {
    clearSession(cookies);
  }
}
