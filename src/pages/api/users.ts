import type { APIRoute } from 'astro';
import { authProxy } from '../../lib/api/http';

/**
 * Usuarios:
 * - `GET /api/users`  → listado/búsqueda (admin/organizador)
 * - `POST /api/users` → creación (admin)
 */
const path = authProxy(() => '/api/users');

export const GET = path;
export const POST = path;
