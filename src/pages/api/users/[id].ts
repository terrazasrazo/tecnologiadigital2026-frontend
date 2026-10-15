import type { APIRoute } from 'astro';
import { authProxy } from '../../../lib/api/http';

/**
 * Gestión de un usuario (admin):
 * - `PATCH /api/users/:id`
 * - `DELETE /api/users/:id`
 */
const path = authProxy((params) => `/api/users/${params.id}`);

export const PATCH = path;
export const DELETE = path;
