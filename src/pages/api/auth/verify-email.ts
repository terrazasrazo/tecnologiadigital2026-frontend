import type { APIRoute } from 'astro';
import { proxyPost } from '../../../lib/api/http';

/** `POST /api/auth/verify-email` → `{ success }` o INVALID_TOKEN / TOKEN_EXPIRED. */
export const POST: APIRoute = proxyPost('/api/auth/verify-email');
