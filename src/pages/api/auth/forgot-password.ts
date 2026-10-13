import type { APIRoute } from 'astro';
import { proxyPost } from '../../../lib/api/http';

/** `POST /api/auth/forgot-password` → `{ success }`. */
export const POST: APIRoute = proxyPost('/api/auth/forgot-password');
