import type { APIRoute } from 'astro';
import { authProxy } from '../../../../../lib/api/http';

/**
 * Check-in manual por el organizador:
 * `POST /api/attendance/talks/:talkId/attendance` (body: userId, attended).
 */
export const POST = authProxy((params) => `/api/attendance/talks/${params.talkId}/attendance`);
