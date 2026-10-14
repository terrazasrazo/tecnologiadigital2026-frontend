import type { APIRoute } from 'astro';
import { authProxy } from '../../../lib/api/http';

/**
 * Gestión de una ubicación (organizador/admin):
 * - `PATCH /api/locations/:id`
 * - `DELETE /api/locations/:id`
 */
const path = authProxy((params) => `/api/locations/${params.id}`);

export const PATCH = path;
export const DELETE = path;
