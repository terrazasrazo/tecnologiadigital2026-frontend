import type { APIRoute } from 'astro';
import { authProxy } from '../../../../lib/api/http';

/** Cambio de contraseña: `POST /api/users/me/change-password`. */
export const POST = authProxy(() => '/api/users/me/change-password');
