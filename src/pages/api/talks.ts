import type { APIRoute } from 'astro';
import { authProxy } from '../../lib/api/http';

/** Alta de ponencias (organizador/admin): `POST /api/talks`. */
export const POST = authProxy(() => '/api/talks');
