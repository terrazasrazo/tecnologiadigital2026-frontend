/**
 * Mensajes amigables en español para los códigos de error del backend
 * (ver README-backend.md → "Códigos de error").
 */

const MESSAGES: Record<string, string> = {
  // Auth
  VALIDATION_ERROR: 'Revisa los campos marcados.',
  INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
  ACCOUNT_NOT_ACTIVE:
    'Tu cuenta aún no está activa. Revisa tu correo para verificarla.',
  EMAIL_IN_USE: 'Ese correo ya está registrado.',
  INVALID_TOKEN: 'El enlace no es válido.',
  TOKEN_EXPIRED: 'El enlace ha expirado. Solicita uno nuevo.',
  TOKEN_ALREADY_USED: 'El enlace ya fue utilizado. Solicita uno nuevo.',
  INVALID_CURRENT_PASSWORD: 'La contraseña actual no es correcta.',
  UNAUTHORIZED: 'Tu sesión expiró. Inicia sesión de nuevo.',
  FORBIDDEN: 'No tienes permiso para realizar esta acción.',
  INVALID_REFRESH_TOKEN: 'Tu sesión expiró. Inicia sesión de nuevo.',
  REFRESH_TOKEN_EXPIRED: 'Tu sesión expiró. Inicia sesión de nuevo.',
  REFRESH_TOKEN_REUSED: 'Tu sesión expiró. Inicia sesión de nuevo.',

  // Dominio
  TALK_NOT_FOUND: 'La ponencia no existe.',
  SPEAKER_NOT_FOUND: 'El ponente no existe.',
  LOCATION_NOT_FOUND: 'La ubicación no existe.',
  USER_NOT_FOUND: 'El usuario no existe.',
  CERTIFICATE_NOT_FOUND: 'Aún no tienes constancia.',
  TALK_CANCELLED: 'Esta ponencia fue cancelada.',
  REGISTRATION_CLOSED: 'Las inscripciones para esta ponencia están cerradas.',
  ALREADY_REGISTERED: 'Ya estás inscrito en esta ponencia.',
  REGISTRATION_NOT_FOUND: 'No estás inscrito en esta ponencia.',
  CANNOT_CANCEL_ATTENDED: 'No puedes cancelar: ya se registró tu asistencia.',
  ATTENDANCE_NOT_OPEN: 'La asistencia aún no está abierta para esta ponencia.',
  ATTENDANCE_CLOSED: 'El tiempo de asistencia para esta ponencia terminó.',
  INVALID_QR: 'El código QR no es válido para esta ponencia.',
  NOT_ELIGIBLE: 'Aún no cumples los requisitos para la constancia.',
  TALK_TIME_CONFLICT: 'La horaria se solapa con otra ponencia.',
  INVALID_TIME_RANGE: 'La hora de fin debe ser posterior a la hora de inicio.',
  CERTIFICATE_FILE_MISSING: 'El PDF de la constancia no está disponible. Genera la constancia de nuevo.',
  EMAIL_IN_USE_DUP: 'Ese correo ya está registrado.',
  INVALID_FILE_TYPE: 'Formato de imagen no permitido (usa JPG, PNG o WEBP).',
  LIMIT_FILE_SIZE: 'La imagen no puede superar 5 MB.',
  SPEAKER_ALREADY_LINKED: 'Esa cuenta ya tiene un perfil de ponente vinculado.',
  CANNOT_DELETE_SELF: 'No puedes eliminar tu propia cuenta.',
  INVALID_ROLE: 'El rol indicado no existe.',

  // Infraestructura
  NETWORK_ERROR: 'No se pudo conectar con el servidor del evento.',
  INTERNAL_ERROR: 'Error del servidor. Inténtalo más tarde.',
  MAIL_SEND_FAILED: 'No se pudo enviar el correo. Inténtalo más tarde.',
  PDF_RENDER_FAILED: 'No se pudo generar el PDF de la constancia.',
};

/** Mensaje legible para un código de error (o el mensaje original del API). */
export function messageFor(code: string | undefined, fallback?: string): string {
  if (code && MESSAGES[code]) return MESSAGES[code];
  return fallback ?? 'Ocurrió un error. Inténtalo de nuevo.';
}

interface ZodIssue {
  path?: Array<string | number>;
  message?: string;
}

/**
 * Convierte `details` de un `VALIDATION_ERROR` (array de issues de Zod) en un
 * mapa `{ campo: mensaje }` para marcar inputs individuales.
 */
export function fieldErrors(details: unknown): Record<string, string> {
  if (!Array.isArray(details)) return {};
  const out: Record<string, string> = {};
  for (const raw of details as ZodIssue[]) {
    if (!raw || typeof raw.message !== 'string' || !Array.isArray(raw.path)) continue;
    // El backend antepone "body" o "query" al path; usamos el último segmento.
    const last = raw.path[raw.path.length - 1];
    const key = last === undefined ? '_' : String(last);
    if (!(key in out)) out[key] = raw.message;
  }
  return out;
}
