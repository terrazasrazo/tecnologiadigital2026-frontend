import type { APIRoute } from 'astro';
import { authProxy } from '../../../../../lib/api/http';

/**
 * Token del QR de una ponencia (organizador):
 * `GET /api/attendance/talks/:talkId/qr` → { talkId, token, opensAt, closesAt }.
 */
export const GET = authProxy((params) => `/api/attendance/talks/${params.talkId}/qr`);
