import type { APIRoute } from 'astro';
import { authProxy } from '../../../../../lib/api/http';

/**
 * Inscripción y cancelación en ponencias (asistente):
 * - `POST /api/attendance/talks/:talkId/register`
 * - `DELETE /api/attendance/talks/:talkId/register`
 */
const path = authProxy(
  (params) => `/api/attendance/talks/${params.talkId}/register`,
);

export const POST = path;
export const DELETE = path;
