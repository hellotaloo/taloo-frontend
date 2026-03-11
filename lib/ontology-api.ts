import { authFetch } from './api';
import type { OntologyOverview, OntologyEntitiesResponse, OntologyEntity } from './types';

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
