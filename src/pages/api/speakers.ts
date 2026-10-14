import type { APIRoute } from 'astro';
import { authProxy } from '../../lib/api/http';

/** Alta de ponentes (organizador/admin): `POST /api/speakers` (multipart). */
export const POST = authProxy(() => '/api/speakers');
