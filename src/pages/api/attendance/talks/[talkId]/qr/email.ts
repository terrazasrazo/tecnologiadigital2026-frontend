import type { APIRoute } from 'astro';
import { authProxy } from '../../../../../../lib/api/http';

/**
 * Envía el QR de asistencia por correo a los ponentes de la ponencia:
 * `POST /api/attendance/talks/:talkId/qr/email` → { sent, recipients }.
 */
export const POST = authProxy((params) => `/api/attendance/talks/${params.talkId}/qr/email`);
