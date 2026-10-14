import type { APIRoute } from 'astro';
import { authProxy } from '../../../lib/api/http';

/**
 * Gestión de un ponente:
 * - `PATCH /api/speakers/:id` (dueño o admin/organizador)
 * - `DELETE /api/speakers/:id` (admin/organizador)
 */
const path = authProxy((params) => `/api/speakers/${params.id}`);

export const PATCH = path;
export const DELETE = path;
