import type { APIRoute } from 'astro';
import { authProxy } from '../../../../lib/api/http';

/** Cambio de estado de un usuario (admin): `PATCH /api/users/:id/status`. */
export const PATCH = authProxy((params) => `/api/users/${params.id}/status`);
