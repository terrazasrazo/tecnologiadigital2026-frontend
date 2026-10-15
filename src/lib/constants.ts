import type { RoleName, TalkStatus, UserStatus, RegistrationStatus } from './types';

/** Rutas del frontend */
export const ROUTES = {
  home: '/',
  agenda: '/agenda',
  ponentes: '/ponentes',
  login: '/auth/login',
  register: '/auth/register',
  verifyEmail: '/auth/verify-email',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  /** Dashboard del asistente */
  app: '/app/dashboard',
  misPonencias: '/app/mis-ponencias',
  checkin: '/app/checkin',
  perfil: '/app/perfil',
  constancia: '/app/constancia',
  /** Ponente */
  ponentePerfil: '/ponente/perfil',
  ponentePonencias: '/ponente/mis-ponencias',
  /** Organizador */
  organizador: '/organizador/ponencias',
  /** Admin */
  admin: '/admin/estadisticas',
} as const;

/** Ruta de inicio de sesión por rol */
export const HOME_BY_ROLE: Record<RoleName, string> = {
  asistente: ROUTES.app,
  ponente: ROUTES.ponentePerfil,
  organizador: ROUTES.organizador,
  admin: ROUTES.admin,
};

/** Etiquetas de rol */
export const ROLE_LABELS: Record<RoleName, string> = {
  admin: 'Administrador',
  organizador: 'Organizador',
  ponente: 'Ponente',
  asistente: 'Asistente',
};

/** Etiquetas de estado de usuario */
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  pending: 'Pendiente',
  active: 'Activo',
  inactive: 'Inactivo',
};

/** Etiquetas de estado de ponencia */
export const TALK_STATUS_LABELS: Record<TalkStatus, string> = {
  scheduled: 'Programada',
  cancelled: 'Cancelada',
};

/** Etiquetas de estado de inscripción */
export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  registered: 'Inscrito',
  attended: 'Asistió',
  cancelled: 'Cancelado',
};

/** Prefijo de todas las rutas de la API (salvo GET /health) */
export const API_PREFIX = '/api';

/** Opciones de nivel educativo (perfil de usuario) */
export const EDUCATION_LEVELS = [
  'Estudiante',
  'Licenciatura',
  'Maestría',
  'Doctorado',
  'Docente',
  'Otro',
];

/** Ruta de salud del backend */
export const API_HEALTH = '/health';

/** Cookies gestionadas por el frontend */
export const COOKIES = {
  /** Refresh token (httpOnly) */
  refreshToken: 'congreso_refresh',
  /** Access token usado por el servidor para llamar al API (httpOnly) */
  accessToken: 'congreso_access',
  /** Usuario serializado (legible por el cliente para la UI) */
  sessionUser: 'congreso_user',
} as const;

/** Claves de localStorage del cliente */
export const STORAGE_KEYS = {
  pendingEmail: 'congreso_pending_email',
} as const;
