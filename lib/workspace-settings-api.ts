import { authFetch } from './api';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WorkspaceLanguage = 'nl' | 'en';

export interface WorkspaceSettings {
  language: WorkspaceLanguage;
  spoken_name?: string | null;
}

export type WorkspaceSettingsUpdate = Partial<WorkspaceSettings>;

export interface WorkspaceUpdate {
  name?: string;
  logo_url?: string | null;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export async function getWorkspaceSettings(workspaceId: string): Promise<WorkspaceSettings> {
  const response = await authFetch(`${BACKEND_URL}/workspaces/${workspaceId}/settings`);
  if (!response.ok) {
    throw new Error('Failed to fetch workspace settings');
  }
  return response.json();
}

export async function updateWorkspaceSettings(
  workspaceId: string,
  updates: WorkspaceSettingsUpdate,
): Promise<WorkspaceSettings> {
  const response = await authFetch(`${BACKEND_URL}/workspaces/${workspaceId}/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error('Failed to update workspace settings');
  }
  return response.json();
}

export async function updateWorkspace(
  workspaceId: string,
  updates: WorkspaceUpdate,
): Promise<void> {
  const response = await authFetch(`${BACKEND_URL}/workspaces/${workspaceId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error('Failed to update workspace');
  }
}
