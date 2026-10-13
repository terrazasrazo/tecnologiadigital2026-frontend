/** Endpoints de ubicaciones: `/api/locations/*`. */
import type { Location, LocationPayload, Paginated, PageQuery } from '../types';
import { apiFetch } from './client';

export type LocationQuery = PageQuery & {
  search?: string;
};

// --- Públicos --------------------------------------------------------------

export function list(query: LocationQuery = {}): Promise<Paginated<Location>> {
  return apiFetch('/api/locations', { query });
}

export function getById(id: number): Promise<Location> {
  return apiFetch(`/api/locations/${id}`);
}

// --- Gestión (admin/organizador) -------------------------------------------

export function create(accessToken: string, payload: LocationPayload): Promise<Location> {
  return apiFetch('/api/locations', { method: 'POST', body: payload, accessToken });
}

export function update(
  accessToken: string,
  id: number,
  payload: Partial<LocationPayload>,
): Promise<Location> {
  return apiFetch(`/api/locations/${id}`, { method: 'PATCH', body: payload, accessToken });
}

export function remove(accessToken: string, id: number): Promise<{ success: boolean }> {
  return apiFetch(`/api/locations/${id}`, { method: 'DELETE', accessToken });
}
