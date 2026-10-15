/** Endpoints de configuración: `/api/settings` (admin). */
import type { CertificateSettings, SettingsResponse } from '../types';
import { apiFetch } from './client';

export function getSettings(accessToken: string): Promise<SettingsResponse> {
  return apiFetch('/api/settings', { accessToken });
}

export function updateSettings(
  accessToken: string,
  payload: Partial<CertificateSettings>,
): Promise<SettingsResponse> {
  return apiFetch('/api/settings', { method: 'PATCH', body: payload, accessToken });
}
