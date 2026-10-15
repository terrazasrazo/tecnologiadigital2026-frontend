/** Endpoints de estadísticas: `/api/stats` (admin). */
import type { Stats } from '../types';
import { apiFetch } from './client';

export function getStats(accessToken: string): Promise<Stats> {
  return apiFetch('/api/stats', { accessToken });
}
