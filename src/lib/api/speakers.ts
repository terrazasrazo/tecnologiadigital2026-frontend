/** Endpoints de ponentes: `/api/speakers/*`. */
import type { Paginated, PageQuery, Speaker, SpeakerPayload } from '../types';
import { apiFetch } from './client';

export type SpeakerQuery = PageQuery & {
  search?: string;
};

// --- Públicos --------------------------------------------------------------

export function list(query: SpeakerQuery = {}): Promise<Paginated<Speaker>> {
  return apiFetch('/api/speakers', { query });
}

export function getById(id: number): Promise<Speaker> {
  return apiFetch(`/api/speakers/${id}`);
}

// --- Gestión (admin/organizador/dueño) -------------------------------------

function toFormData(payload: Partial<SpeakerPayload>): FormData {
  const fd = new FormData();
  const fields: Array<keyof SpeakerPayload> = ['name', 'academicDegree', 'institution', 'bio'];
  for (const field of fields) {
    const value = payload[field];
    if (typeof value === 'string') fd.set(field, value);
  }
  if (payload.userId !== undefined) fd.set('userId', String(payload.userId));
  if (payload.photo) fd.set('photo', payload.photo);
  return fd;
}

export function create(accessToken: string, payload: SpeakerPayload): Promise<Speaker> {
  return apiFetch('/api/speakers', {
    method: 'POST',
    body: toFormData(payload),
    accessToken,
  });
}

export function update(
  accessToken: string,
  id: number,
  payload: Partial<SpeakerPayload>,
): Promise<Speaker> {
  return apiFetch(`/api/speakers/${id}`, {
    method: 'PATCH',
    body: toFormData(payload),
    accessToken,
  });
}

export function removePhoto(accessToken: string, id: number): Promise<Speaker> {
  return apiFetch(`/api/speakers/${id}/photo`, { method: 'DELETE', accessToken });
}

export function remove(accessToken: string, id: number): Promise<{ success: boolean }> {
  return apiFetch(`/api/speakers/${id}`, { method: 'DELETE', accessToken });
}
