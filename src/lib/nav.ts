/**
 * Elementos de navegación por rol, usados por el sidebar del dashboard y
 * por la navegación móvil.
 */
import type { RoleName } from './types';
import { ROUTES } from './constants';

export interface NavItem {
  href: string;
  label: string;
}

export const PUBLIC_NAV: NavItem[] = [
  { href: ROUTES.home, label: 'Inicio' },
  { href: ROUTES.agenda, label: 'Agenda' },
  { href: ROUTES.ponentes, label: 'Ponentes' },
];

const NAV_BY_ROLE: Record<RoleName, NavItem[]> = {
  asistente: [
    { href: ROUTES.app, label: 'Mi panel' },
    { href: ROUTES.misPonencias, label: 'Mis ponencias' },
    { href: ROUTES.checkin, label: 'Check-in' },
    { href: ROUTES.constancia, label: 'Constancia' },
    { href: ROUTES.perfil, label: 'Mi perfil' },
  ],
  ponente: [
    { href: ROUTES.ponentePerfil, label: 'Mi perfil' },
    { href: ROUTES.ponentePonencias, label: 'Mis ponencias' },
  ],
  organizador: [
    { href: ROUTES.organizador, label: 'Ponencias' },
    { href: '/organizador/ponentes', label: 'Ponentes' },
    { href: '/organizador/ubicaciones', label: 'Ubicaciones' },
    { href: '/organizador/constancias', label: 'Constancias' },
  ],
  admin: [
    { href: ROUTES.admin, label: 'Estadísticas' },
    { href: '/admin/usuarios', label: 'Usuarios' },
    { href: '/admin/configuracion', label: 'Configuración' },
  ],
};

/** Navegación del sidebar para un rol. */
export function navItemsFor(role: RoleName): NavItem[] {
  return NAV_BY_ROLE[role];
}
