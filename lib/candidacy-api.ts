import { authFetch } from './api';
import type { Candidacy, CandidaciesResponse, CandidacyStage, PlacementCreate } from './types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

function getWorkspaceId(): string {
  return typeof window !== 'undefined'
    ? localStorage.getItem('workspace_id') || ''
    : '';
}

// =============================================================================
// Single
// =============================================================================

export async function getCandidacy(candidacyId: string): Promise<Candidacy> {
  const url = `${BACKEND_URL}/candidacies/${candidacyId}`;
  const response = await authFetch(url);
  if (!response.ok) throw new Error('Failed to fetch candidacy');
  return response.json();
}

// =============================================================================
// List
// =============================================================================

export interface GetCandidaciesParams {
  vacancy_id?: string;
  candidate_id?: string;
  workspace_id?: string;
  stage?: CandidacyStage;
}

export async function getCandidacies(
  params: GetCandidaciesParams,
): Promise<CandidaciesResponse> {
  const searchParams = new URLSearchParams();

  if (params.vacancy_id) {
    searchParams.set('vacancy_id', params.vacancy_id);
  } else if (params.candidate_id) {
    searchParams.set('candidate_id', params.candidate_id);
  } else {
    searchParams.set('workspace_id', params.workspace_id ?? getWorkspaceId());
  }

  if (params.stage) searchParams.set('stage', params.stage);

  const url = `${BACKEND_URL}/candidacies?${searchParams.toString()}`;
  const response = await authFetch(url);
  if (!response.ok) throw new Error('Failed to fetch candidacies');
  const data = await response.json();
  // Normalise: backend may return array directly or { items: [...] }
  if (Array.isArray(data)) return { items: data, total: data.length };
  return { items: data.items ?? [], total: data.total ?? 0 };
}

// =============================================================================
// Create
// =============================================================================

export interface CreateCandidacyBody {
  vacancy_id: string | null;
  candidate_id: string;
  stage?: CandidacyStage;
  source?: string;
}

export async function createCandidacy(body: CreateCandidacyBody): Promise<Candidacy> {
  const url = `${BACKEND_URL}/candidacies?workspace_id=${getWorkspaceId()}`;
  const response = await authFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (response.status === 409) throw new Error('CONFLICT');
  if (!response.ok) throw new Error('Failed to create candidacy');
  return response.json();
}

// =============================================================================
// Update stage
// =============================================================================

export async function patchCandidacy(
  candidacyId: string,
  body: { stage: CandidacyStage; placement?: PlacementCreate },
): Promise<Candidacy> {
  // Backend uses query param: PATCH /candidacies/{id}/stage?stage=qualified
  const url = `${BACKEND_URL}/candidacies/${candidacyId}/stage?stage=${body.stage}`;
  const options: RequestInit = { method: 'PATCH' };

  if (body.placement) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body.placement);
  }

  const response = await authFetch(url, options);
  if (!response.ok) throw new Error('Failed to update candidacy');
  return response.json();
}
