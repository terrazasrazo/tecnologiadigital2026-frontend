import type { APIRoute } from 'astro';
import { authProxy } from '../../lib/api/http';

/**
 * Búsqueda de usuarios para vincular (p. ej. UserPicker al crear un ponente):
 * `GET /api/users?search=&role=&page=&pageSize=`.
 */
export const GET = authProxy(() => '/api/users');
