import type { APIRoute } from 'astro';
import { authProxy } from '../../../lib/api/http';

/**
 * Edición del perfil de ponente (dueño o admin/organizador):
 * `PATCH /api/speakers/:id` (multipart: name, academicDegree, institution,
 * bio y opcionalmente el archivo `photo`).
 */
export const PATCH = authProxy((params) => `/api/speakers/${params.id}`);
