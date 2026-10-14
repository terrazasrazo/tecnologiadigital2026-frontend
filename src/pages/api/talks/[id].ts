import type { APIRoute } from 'astro';
import { authProxy } from '../../../lib/api/http';

/**
 * Gestión de una ponencia (organizador/admin):
 * - `PATCH /api/talks/:id`
 * - `DELETE /api/talks/:id`
 */
const path = authProxy((params) => `/api/talks/${params.id}`);

export const PATCH = path;
export const DELETE = path;
