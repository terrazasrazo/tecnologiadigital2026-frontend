/** Endpoints de usuarios: `/api/users/*`. */
import type { Paginated, PageQuery, RoleName, SuccessResponse, User, UserStatus } from '../types';
import { apiFetch } from './client';

export type UserQuery = PageQuery & {
  role?: RoleName;
  status?: UserStatus;
  search?: string;
};

export interface CreateUserPayload {
  name: string;
  lastName: string;
  email: string;
  password: string;
  role: RoleName;
  status?: UserStatus;
  entity?: string;
  educationLevel?: string;
  phone?: string;
}

export interface UpdateUserPayload {
  name?: string;
  lastName?: string;
  email?: string;
  role?: RoleName;
  status?: UserStatus;
  entity?: string | null;
  educationLevel?: string | null;
  phone?: string | null;
}

export interface UpdateMePayload {
  name?: string;
  lastName?: string;
  entity?: string | null;
  educationLevel?: string | null;
  phone?: string | null;
}

// --- Propio usuario (Auth) -------------------------------------------------

export function getMe(accessToken: string): Promise<User> {
  return apiFetch('/api/users/me', { accessToken });
}

export function updateMe(accessToken: string, payload: UpdateMePayload): Promise<User> {
  return apiFetch('/api/users/me', { method: 'PATCH', body: payload, accessToken });
}

export function changePassword(
  accessToken: string,
  currentPassword: string,
  newPassword: string,
): Promise<SuccessResponse> {
  return apiFetch('/api/users/me/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
    accessToken,
  });
}

// --- Administración (admin) ------------------------------------------------

export function list(accessToken: string, query: UserQuery = {}): Promise<Paginated<User>> {
  return apiFetch('/api/users', { query, accessToken });
}

export function create(accessToken: string, payload: CreateUserPayload): Promise<User> {
  return apiFetch('/api/users', { method: 'POST', body: payload, accessToken });
}

export function getById(accessToken: string, id: number): Promise<User> {
  return apiFetch(`/api/users/${id}`, { accessToken });
}

export function update(accessToken: string, id: number, payload: UpdateUserPayload): Promise<User> {
  return apiFetch(`/api/users/${id}`, { method: 'PATCH', body: payload, accessToken });
}

export function updateStatus(
  accessToken: string,
  id: number,
  status: UserStatus,
): Promise<User> {
  return apiFetch(`/api/users/${id}/status`, { method: 'PATCH', body: { status }, accessToken });
}

export function remove(accessToken: string, id: number): Promise<SuccessResponse> {
  return apiFetch(`/api/users/${id}`, { method: 'DELETE', accessToken });
}
