import type { APIRoute } from 'astro';
import { authProxy } from '../../../../../lib/api/http';

/** Check-in con QR (asistente): `POST /api/attendance/talks/:talkId/checkin`. */
export const POST = authProxy((params) => `/api/attendance/talks/${params.talkId}/checkin`);
