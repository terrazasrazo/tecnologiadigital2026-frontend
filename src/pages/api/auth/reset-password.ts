import type { APIRoute } from 'astro';
import { proxyPost } from '../../../lib/api/http';

/** `POST /api/auth/reset-password` → `{ success }` o token inválido/expirado. */
export const POST: APIRoute = proxyPost('/api/auth/reset-password');
