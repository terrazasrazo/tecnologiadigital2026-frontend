import type { APIRoute } from 'astro';
import { proxyPost } from '../../../lib/api/http';

/** `POST /api/auth/resend-verification` → `{ success }`. */
export const POST: APIRoute = proxyPost('/api/auth/resend-verification');
