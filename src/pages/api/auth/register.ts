import type { APIRoute } from 'astro';
import { proxyPost } from '../../../lib/api/http';

/** `POST /api/auth/register` → 201 `{ user }` o error (ej. EMAIL_IN_USE). */
export const POST: APIRoute = proxyPost('/api/auth/register', 201);
