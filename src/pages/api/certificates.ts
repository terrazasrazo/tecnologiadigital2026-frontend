import type { APIRoute } from 'astro';
import { authProxy } from '../../lib/api/http';

/** Genera (o regenera) la constancia del usuario: `POST /api/certificates`. */
export const POST = authProxy(() => '/api/certificates');
