/** Endpoints de constancias: `/api/certificates/*`. */
import type { Certificate, Eligibility, CertificateVerify, Paginated, PageQuery } from '../types';
import { apiFetch, apiRaw } from './client';

export type CertificateQuery = PageQuery & {
  search?: string;
};

// --- Asistente (Auth) ------------------------------------------------------

export function eligibility(accessToken: string): Promise<Eligibility> {
  return apiFetch('/api/certificates/eligibility', { accessToken });
}

/** Constancia del usuario. `404 CERTIFICATE_NOT_FOUND` si aún no existe. */
export function mine(accessToken: string): Promise<Certificate> {
  return apiFetch('/api/certificates/me', { accessToken });
}

/** Genera (o regenera) la constancia y opcionalmente envía el correo. */
export function generate(accessToken: string, sendEmail = true): Promise<Certificate> {
  return apiFetch('/api/certificates', {
    method: 'POST',
    body: { sendEmail },
    accessToken,
  });
}

// --- Gestión (admin/organizador) -------------------------------------------

export function list(accessToken: string, query: CertificateQuery = {}): Promise<Paginated<Certificate>> {
  return apiFetch('/api/certificates', { query, accessToken });
}

export function generateForUser(
  accessToken: string,
  userId: number,
  sendEmail = true,
): Promise<Certificate> {
  return apiFetch(`/api/certificates/users/${userId}`, {
    method: 'POST',
    body: { sendEmail },
    accessToken,
  });
}

// --- Descarga y verificación -----------------------------------------------

/** Descarga el PDF de la constancia (Response crudo con `application/pdf`). */
export async function download(accessToken: string, id: number): Promise<Response> {
  return apiRaw(`/api/certificates/${id}/download`, { accessToken });
}

/** Verificación pública por código. */
export function verify(code: string): Promise<CertificateVerify> {
  return apiFetch(`/api/certificates/verify/${encodeURIComponent(code)}`);
}
