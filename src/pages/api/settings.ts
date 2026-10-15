import type { APIRoute } from 'astro';
import { authProxy } from '../../lib/api/http';

/**
 * Configuración del sistema (admin):
 * - `GET /api/settings`  → configuración actual
 * - `PATCH /api/settings` → actualizar umbral
 */
const path = authProxy(() => '/api/settings');

export const GET = path;
export const PATCH = path;
