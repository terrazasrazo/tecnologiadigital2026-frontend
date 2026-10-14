import type { APIRoute } from 'astro';
import { authProxy } from '../../../../lib/api/http';

/**
 * Emisión de constancia a nombre de otro usuario (organizador/admin):
 * `POST /api/certificates/users/:userId` (body: sendEmail).
 */
export const POST = authProxy((params) => `/api/certificates/users/${params.userId}`);
