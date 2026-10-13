/** Endpoints de autenticación: `/api/auth/*` (públicos). */
import type { AuthResponse, LoginPayload, RegisterPayload, SuccessResponse, User } from '../types';
import { apiFetch } from './client';

export function register(payload: RegisterPayload): Promise<{ user: Pick<User, 'id' | 'name' | 'email' | 'status'> }> {
  return apiFetch('/api/auth/register', { method: 'POST', body: payload });
}

export function verifyEmail(token: string): Promise<SuccessResponse> {
  return apiFetch('/api/auth/verify-email', { method: 'POST', body: { token } });
}

export function resendVerification(email: string): Promise<SuccessResponse> {
  return apiFetch('/api/auth/resend-verification', { method: 'POST', body: { email } });
}

export function forgotPassword(email: string): Promise<SuccessResponse> {
  return apiFetch('/api/auth/forgot-password', { method: 'POST', body: { email } });
}

export function resetPassword(token: string, password: string): Promise<SuccessResponse> {
  return apiFetch('/api/auth/reset-password', { method: 'POST', body: { token, password } });
}

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiFetch('/api/auth/login', { method: 'POST', body: payload });
}

export function refresh(refreshToken: string): Promise<AuthResponse> {
  return apiFetch('/api/auth/refresh', { method: 'POST', body: { refreshToken } });
}

export function logout(refreshToken?: string): Promise<SuccessResponse> {
  return apiFetch('/api/auth/logout', { method: 'POST', body: { refreshToken } });
}
