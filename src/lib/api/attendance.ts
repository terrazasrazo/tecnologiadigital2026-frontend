/** Endpoints de asistencia: `/api/attendance/*`. */
import type { CheckinResponse, Paginated, PageQuery, QRToken, Registration, RegistrationStatus } from '../types';
import { apiFetch } from './client';

export type RegistrationsQuery = PageQuery & {
  status?: RegistrationStatus;
};

// --- Asistente (Auth) ------------------------------------------------------

/** Inscripciones del usuario autenticado (excluye canceladas). */
export function myRegistrations(accessToken: string): Promise<{ data: Registration[] }> {
  return apiFetch('/api/attendance/me', { accessToken });
}

export function register(accessToken: string, talkId: number): Promise<Registration> {
  return apiFetch(`/api/attendance/talks/${talkId}/register`, {
    method: 'POST',
    accessToken,
  });
}

export function cancelRegistration(
  accessToken: string,
  talkId: number,
): Promise<{ success: boolean }> {
  return apiFetch(`/api/attendance/talks/${talkId}/register`, {
    method: 'DELETE',
    accessToken,
  });
}

/** Check-in escaneando el QR de la ponencia (token firmado HMAC). */
export function checkin(accessToken: string, talkId: number, token: string): Promise<CheckinResponse> {
  return apiFetch(`/api/attendance/talks/${talkId}/checkin`, {
    method: 'POST',
    body: { token },
    accessToken,
  });
}

// --- Gestión (admin/organizador) -------------------------------------------

export function listRegistrations(
  accessToken: string,
  talkId: number,
  query: RegistrationsQuery = {},
): Promise<Paginated<Registration>> {
  return apiFetch(`/api/attendance/talks/${talkId}/registrations`, { query, accessToken });
}

/** Token firmado para generar el QR de la ponencia. */
export function getQR(accessToken: string, talkId: number): Promise<QRToken> {
  return apiFetch(`/api/attendance/talks/${talkId}/qr`, { accessToken });
}

/** Check-in manual por usuario (admin/organizador). */
export function manualAttendance(
  accessToken: string,
  talkId: number,
  userId: number,
  attended = true,
): Promise<Registration> {
  return apiFetch(`/api/attendance/talks/${talkId}/attendance`, {
    method: 'POST',
    body: { userId, attended },
    accessToken,
  });
}
