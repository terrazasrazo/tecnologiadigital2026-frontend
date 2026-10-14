import type { APIRoute } from 'astro';
import { authProxy } from '../../../../lib/api/http';

/** Descarga del PDF de una constancia: `GET /api/certificates/:id/download`. */
export const GET = authProxy((params) => `/api/certificates/${params.id}/download`);
