import { authFetch } from './api';
import type {
  OntologyOverview,
  OntologyEntitiesResponse,
  OntologyEntity,
  VerificationSchema,
  ScanMode,
  VerificationConfig,
} from './types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

function getWorkspaceId(): string {
  return typeof window !== 'undefined'
    ? localStorage.getItem('workspace_id') || ''
    : '';
}

// =============================================================================
// Overview
// =============================================================================

export async function getOntologyOverview(): Promise<OntologyOverview> {
  const url = `${BACKEND_URL}/ontology?workspace_id=${getWorkspaceId()}`;
  const response = await authFetch(url);
  if (!response.ok) throw new Error('Failed to fetch ontology overview');
  return response.json();
}

// =============================================================================
// Entities
// =============================================================================

export interface GetEntitiesParams {
  type: string;
  category?: string;
  include_children?: boolean;
  include_inactive?: boolean;
  limit?: number;
}

export async function getOntologyEntities(
  params: GetEntitiesParams,
): Promise<OntologyEntitiesResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set('workspace_id', getWorkspaceId());
  searchParams.set('type', params.type);
  if (params.category) searchParams.set('category', params.category);
  if (params.include_children !== undefined)
    searchParams.set('include_children', params.include_children.toString());
  if (params.include_inactive !== undefined)
    searchParams.set('include_inactive', params.include_inactive.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());

  const url = `${BACKEND_URL}/ontology/entities?${searchParams.toString()}`;
  const response = await authFetch(url);
  if (!response.ok) throw new Error('Failed to fetch ontology entities');
  return response.json();
}

export async function getOntologyEntity(
  entityId: string,
  includeChildren = true,
): Promise<OntologyEntity> {
  const searchParams = new URLSearchParams();
  searchParams.set('include_children', includeChildren.toString());

  const url = `${BACKEND_URL}/ontology/entities/${entityId}?${searchParams.toString()}`;
  const response = await authFetch(url);
  if (!response.ok) throw new Error('Failed to fetch ontology entity');
  return response.json();
}

// =============================================================================
// Verification schema
// =============================================================================

export async function getVerificationSchema(): Promise<VerificationSchema> {
  const url = `${BACKEND_URL}/ontology/verification-schema`;
  const response = await authFetch(url);
  if (!response.ok) throw new Error('Failed to fetch verification schema');
  return response.json();
}

// =============================================================================
// Patch entity
// =============================================================================

export interface PatchEntityBody {
  name?: string;
  category?: string;
  icon?: string;
  is_verifiable?: boolean;
  is_default?: boolean;
  is_active?: boolean;
  scan_mode?: ScanMode;
  verification_config?: VerificationConfig | null;
  sort_order?: number;
}

export interface CreateEntityBody {
  slug: string;
  name: string;
  category: string;
  is_verifiable?: boolean;
  is_default?: boolean;
  scan_mode?: ScanMode;
  sort_order?: number;
  parent_id?: string;
}

export async function createOntologyEntity(body: CreateEntityBody): Promise<OntologyEntity> {
  const url = `${BACKEND_URL}/ontology/entities?workspace_id=${getWorkspaceId()}`;
  const response = await authFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (response.status === 409) {
    const err = new Error('Slug already exists') as Error & { status: number };
    err.status = 409;
    throw err;
  }
  if (!response.ok) throw new Error('Failed to create entity');
  return response.json();
}

export async function deleteOntologyEntity(entityId: string): Promise<void> {
  const url = `${BACKEND_URL}/ontology/entities/${entityId}?workspace_id=${getWorkspaceId()}`;
  const response = await authFetch(url, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete entity');
}

export async function patchOntologyEntity(
  entityId: string,
  body: PatchEntityBody,
): Promise<OntologyEntity> {
  const url = `${BACKEND_URL}/ontology/entities/${entityId}?workspace_id=${getWorkspaceId()}`;
  const response = await authFetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error('Failed to update entity');
  return response.json();
}
