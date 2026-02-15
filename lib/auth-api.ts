/**
 * Authentication API functions
 */

import { AuthResponse, AuthMeResponse, TokenResponse } from './auth-types';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

/**
 * Development-only login endpoint. Creates a dev user and returns a valid JWT token.
 * Only works when backend ENVIRONMENT=local
 */
export async function devLogin(): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/dev-login`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Dev login failed' }));
    throw new Error(error.error || error.detail || 'Dev login failed');
  }

  return response.json();
}

/**
 * Get Google OAuth login URL
 */
export function getGoogleLoginUrl(redirectTo?: string): string {
  const params = redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : '';
  return `${API_URL}/auth/login/google${params}`;
}

/**
 * Handle OAuth callback - exchange code for tokens
 */
export async function handleAuthCallback(code: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/callback?code=${encodeURIComponent(code)}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Authentication failed' }));
    throw new Error(error.error || error.detail || 'Authentication failed');
  }

  return response.json();
}

/**
 * Get current user info and workspaces
 */
export async function getCurrentUser(token: string): Promise<AuthMeResponse> {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Token expired or invalid');
    }
    const error = await response.json().catch(() => ({ error: 'Failed to get user' }));
    throw new Error(error.error || error.detail || 'Failed to get user');
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  return response.json();
}

/**
 * Logout current user
 */
export async function logout(token?: string): Promise<void> {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });
}
