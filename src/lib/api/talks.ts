/** Endpoints de ponencias: `/api/talks/*`. */
import type { Paginated, Talk, TalkPayload, TalkQuery } from '../types';
import { apiFetch } from './client';

// --- Públicos --------------------------------------------------------------

export function list(query: TalkQuery = {}): Promise<Paginated<Talk>> {
  return apiFetch('/api/talks', { query });
}

export function getById(id: number): Promise<Talk> {
  return apiFetch(`/api/talks/${id}`);
}

// --- Gestión (admin/organizador) -------------------------------------------

export function create(accessToken: string, payload: TalkPayload): Promise<Talk> {
  return apiFetch('/api/talks', { method: 'POST', body: payload, accessToken });
}

export function update(
  accessToken: string,
  id: number,
  payload: Partial<TalkPayload>,
): Promise<Talk> {
  return apiFetch(`/api/talks/${id}`, { method: 'PATCH', body: payload, accessToken });
}

export function remove(accessToken: string, id: number): Promise<{ success: boolean }> {
  return apiFetch(`/api/talks/${id}`, { method: 'DELETE', accessToken });
}
