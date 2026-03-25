import { authFetch } from './api';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

// --- Types ---

export type MemberRole = 'super_admin' | 'owner' | 'admin' | 'member';

export interface WorkspaceMember {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: MemberRole;
  joined_at: string;
}

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  email: string;
  role: string;
  invited_by: string;
  invited_by_name: string | null;
  expires_at: string | null;
  created_at: string | null;
}

export interface InviteMemberRequest {
  email: string;
  role: 'admin' | 'member';
}

export interface InviteResponse {
  // Direct add
  status?: string;
  email?: string;
  role?: string;
  message?: string;
  // Invitation
  id?: string;
  workspace_id?: string;
  invited_by?: string;
  expires_at?: string | null;
  created_at?: string | null;
}

export interface AcceptInvitationResponse {
  workspace_id: string;
  workspace_name: string;
  workspace_slug: string;
  role: string;
}

// --- API Functions ---

export async function acceptInvitation(token: string): Promise<AcceptInvitationResponse> {
  const response = await authFetch(`${BACKEND_URL}/workspaces/invitations/accept`, {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
  if (response.status === 403) {
    const err = await response.json();
    throw new Error(err.detail || 'Uitnodiging ongeldig of verlopen');
  }
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Kon uitnodiging niet accepteren');
  }
  return response.json();
}

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const response = await authFetch(`${BACKEND_URL}/workspaces/${workspaceId}/members`);
  if (!response.ok) throw new Error('Failed to fetch members');
  return response.json();
}

export async function getWorkspaceInvitations(workspaceId: string): Promise<WorkspaceInvitation[]> {
  const response = await authFetch(`${BACKEND_URL}/workspaces/${workspaceId}/invitations`);
  if (!response.ok) throw new Error('Failed to fetch invitations');
  return response.json();
}

export async function inviteMember(
  workspaceId: string,
  data: InviteMemberRequest
): Promise<InviteResponse> {
  const response = await authFetch(`${BACKEND_URL}/workspaces/${workspaceId}/invitations`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (response.status === 403) {
    const err = await response.json();
    throw new Error(err.detail || 'Geen toestemming');
  }
  if (!response.ok) throw new Error('Failed to invite member');
  return response.json();
}

export async function cancelInvitation(
  workspaceId: string,
  invitationId: string
): Promise<void> {
  const response = await authFetch(
    `${BACKEND_URL}/workspaces/${workspaceId}/invitations/${invitationId}`,
    { method: 'DELETE' }
  );
  if (!response.ok) throw new Error('Failed to cancel invitation');
}

export async function updateMemberRole(
  workspaceId: string,
  userId: string,
  data: { role: 'admin' | 'member' }
): Promise<{ user_id: string; workspace_id: string; role: string }> {
  const response = await authFetch(
    `${BACKEND_URL}/workspaces/${workspaceId}/members/${userId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
  if (response.status === 403) {
    const err = await response.json();
    throw new Error(err.detail || 'Geen toestemming');
  }
  if (!response.ok) throw new Error('Failed to update member role');
  return response.json();
}

export async function removeMember(
  workspaceId: string,
  userId: string
): Promise<void> {
  const response = await authFetch(
    `${BACKEND_URL}/workspaces/${workspaceId}/members/${userId}`,
    { method: 'DELETE' }
  );
  if (response.status === 403) {
    const err = await response.json();
    throw new Error(err.detail || 'Geen toestemming');
  }
  if (!response.ok) throw new Error('Failed to remove member');
}
