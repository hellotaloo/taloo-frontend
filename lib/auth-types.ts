/**
 * Authentication types based on API_CONTRACT.md
 */

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  role: 'super_admin' | 'owner' | 'admin' | 'member';
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
  user: UserProfile;
  workspaces: WorkspaceSummary[];
}

export interface AuthMeResponse {
  user: UserProfile;
  workspaces: WorkspaceSummary[];
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
}
