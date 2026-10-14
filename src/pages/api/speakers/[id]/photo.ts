import type { APIRoute } from 'astro';
import { authProxy } from '../../../../lib/api/http';

/** Elimina la fotografía del ponente: `DELETE /api/speakers/:id/photo`. */
export const DELETE = authProxy((params) => `/api/speakers/${params.id}/photo`);
