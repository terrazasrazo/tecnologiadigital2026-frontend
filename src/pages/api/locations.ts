import type { APIRoute } from 'astro';
import { authProxy } from '../../lib/api/http';

/** Alta de ubicaciones (organizador/admin): `POST /api/locations`. */
export const POST = authProxy(() => '/api/locations');
